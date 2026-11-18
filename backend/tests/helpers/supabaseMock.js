'use strict';

const tables = new Map();
const configuredErrors = new Map();

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

class Query {
  constructor(table) {
    this.table = table;
    this.action = 'select';
    this.filters = [];
    this.payload = null;
    this.options = {};
    this.returnMode = null;
    this.rowLimit = null;
    this.orderBy = null;
  }

  select(_columns, options = {}) {
    if (this.action === 'select') this.options = options;
    return this;
  }

  insert(rows) {
    this.action = 'insert';
    this.payload = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  update(values) {
    this.action = 'update';
    this.payload = values;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column, value) { return this.addFilter(column, (actual) => actual === value); }
  neq(column, value) { return this.addFilter(column, (actual) => actual !== value); }
  gt(column, value) { return this.addFilter(column, (actual) => actual > value); }
  gte(column, value) { return this.addFilter(column, (actual) => actual >= value); }
  lt(column, value) { return this.addFilter(column, (actual) => actual < value); }
  lte(column, value) { return this.addFilter(column, (actual) => actual <= value); }
  is(column, value) { return this.addFilter(column, (actual) => actual === value); }

  addFilter(column, predicate) {
    this.filters.push((row) => predicate(row[column]));
    return this;
  }

  or() { return this; }

  order(column, { ascending = true } = {}) {
    this.orderBy = { column, ascending };
    return this;
  }

  limit(count) {
    this.rowLimit = count;
    return this;
  }

  single() { this.returnMode = 'single'; return this; }
  maybeSingle() { this.returnMode = 'maybeSingle'; return this; }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  async execute() {
    const error = configuredErrors.get(this.table);
    if (error) return { data: null, error };

    const rows = tables.get(this.table) || [];
    let result;

    if (this.action === 'insert') {
      result = this.payload.map((item, index) => {
        const row = { ...clone(item) };
        if (row.id == null) row.id = `${this.table}-${rows.length + index + 1}`;
        rows.push(row);
        return row;
      });
    } else {
      const matched = rows.filter((row) => this.filters.every((filter) => filter(row)));
      if (this.action === 'update') {
        matched.forEach((row) => Object.assign(row, clone(this.payload)));
        result = matched;
      } else if (this.action === 'delete') {
        const remaining = rows.filter((row) => !matched.includes(row));
        tables.set(this.table, remaining);
        result = matched;
      } else {
        result = matched.slice();
      }
    }

    if (this.orderBy) {
      const { column, ascending } = this.orderBy;
      result.sort((left, right) => {
        if (left[column] === right[column]) return 0;
        return (left[column] < right[column] ? -1 : 1) * (ascending ? 1 : -1);
      });
    }

    const count = result.length;
    if (this.rowLimit != null) result = result.slice(0, this.rowLimit);
    if (this.returnMode === 'single') {
      if (result.length !== 1) {
        return { data: null, error: { code: 'PGRST116', message: 'Expected one row' } };
      }
      return { data: result[0], error: null };
    }
    if (this.returnMode === 'maybeSingle') {
      if (result.length > 1) {
        return { data: null, error: { code: 'PGRST116', message: 'Expected at most one row' } };
      }
      return { data: result[0] || null, error: null };
    }
    if (this.options.count === 'exact') {
      return { data: this.options.head ? null : result, count, error: null };
    }
    return { data: result, error: null };
  }
}

const supabase = {
  from(table) { return new Query(table); },
  async rpc() { return { data: null, error: null }; },
  auth: {
    async getUser() { return { data: { user: null }, error: null }; },
  },
};

const db = {
  seed(table, rows) { tables.set(table, clone(rows)); },
  rows(table) { return tables.get(table) || []; },
  fail(table, error) { configuredErrors.set(table, error); },
  reset() {
    tables.clear();
    configuredErrors.clear();
  },
};

module.exports = { supabase, db };
