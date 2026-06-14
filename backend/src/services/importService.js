const csv = require('csv-parse/lib/sync');

async function parseCsv(buffer) {
  const text = buffer.toString();
  return csv(text, { columns: true });
}

module.exports = { parseCsv };
