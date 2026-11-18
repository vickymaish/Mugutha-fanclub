'use strict';

jest.mock('node-cron', () => ({
  schedule: jest.fn(() => ({ stop: jest.fn() })),
}));

const cron = require('node-cron');
const { scheduleCron } = require('../src/services/schedulerService');

describe('scheduler service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('schedules jobs in the Africa/Nairobi timezone', () => {
    const job = jest.fn();
    process.env.SCHEDULER_ENABLED = 'true';

    scheduleCron('0 10 * * *', job, { name: 'renewals' });

    expect(cron.schedule).toHaveBeenCalledWith(
      '0 10 * * *',
      expect.any(Function),
      { timezone: 'Africa/Nairobi' },
    );
  });

  test('does not start a job when SCHEDULER_ENABLED is false', () => {
    process.env.SCHEDULER_ENABLED = 'false';

    expect(scheduleCron('0 10 * * *', jest.fn(), { name: 'renewals' })).toBeNull();
    expect(cron.schedule).not.toHaveBeenCalled();
  });
});
