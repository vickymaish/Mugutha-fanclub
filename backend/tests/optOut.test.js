'use strict';

process.env.WHATSAPP_PROVIDER = 'mock';

jest.mock('../src/config/supabase', () => require('./helpers/supabaseMock').supabase);
jest.mock('../src/services/whatsappService', () => ({
  sendMessage: jest.fn().mockResolvedValue(undefined),
}));

const { db } = require('./helpers/supabaseMock');
const optOut = require('../src/services/optOut');
const { sendMessage } = require('../src/services/whatsappService');

describe('member opt-out commands', () => {
  beforeEach(() => {
    db.reset();
    db.seed('members', [{ id: 'member-1', phone: '254700000001', opted_out: false }]);
    sendMessage.mockClear();
  });

  test.each(['STOP', 'stop', ' Stop '])('%s opts the member out', async (text) => {
    await expect(optOut.handle({ from: '254700000001', text })).resolves.toBe(true);
    expect(db.rows('members')[0].opted_out).toBe(true);
  });

  test('START opts the member back in', async () => {
    db.rows('members')[0].opted_out = true;

    await expect(optOut.handle({ from: '254700000001', text: 'START' })).resolves.toBe(true);

    expect(db.rows('members')[0].opted_out).toBe(false);
  });

  test('unrelated words do not change opt-out state or send a reply', async () => {
    await expect(optOut.handle({ from: '254700000001', text: 'hello there' })).resolves.toBe(false);

    expect(db.rows('members')[0].opted_out).toBe(false);
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
