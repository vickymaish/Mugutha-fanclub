'use strict';

jest.mock('../src/models/supabaseQueries', () => ({
  listAllMembers: jest.fn(),
  listMembersByTier: jest.fn(),
  updateBroadcastStatus: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/services/whatsappService', () => ({
  sendMessage: jest.fn().mockResolvedValue(undefined),
}));

const {
  listAllMembers,
  updateBroadcastStatus,
} = require('../src/models/supabaseQueries');
const { sendMessage } = require('../src/services/whatsappService');
const { sendBroadcastNow } = require('../src/services/broadcastService');

describe('broadcast recipient filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('does not send broadcasts to opted-out or demo members', async () => {
    listAllMembers.mockResolvedValue([
      { id: 'eligible', phone: '254700000001', opted_out: false, is_demo: false },
      { id: 'opted-out', phone: '254700000002', opted_out: true, is_demo: false },
      { id: 'demo', phone: '254700000003', opted_out: false, is_demo: true },
    ]);

    const result = await sendBroadcastNow({
      id: 'broadcast-1',
      title: 'Club update',
      message: 'A club update',
      tier: 'all',
    });

    expect(result.membersSent).toBe(1);
    expect(result.results).toMatchObject({ total: 1, sent: 1, failed: 0 });
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({ phone: '254700000001' }));
    expect(updateBroadcastStatus).toHaveBeenCalledWith('broadcast-1', 'sent');
  });
});
