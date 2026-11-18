'use strict';

process.env.WHATSAPP_PROVIDER = 'mock';

jest.mock('../src/config/supabase', () => require('./helpers/supabaseMock').supabase);
jest.mock('../src/services/mpesaService', () => ({
  stkPush: jest.fn(),
  stkQuery: jest.fn(),
}));
jest.mock('../src/services/memberCardService', () => ({
  sendMemberCard: jest.fn().mockResolvedValue(undefined),
  formatDate: jest.fn(() => '18 Nov 2027'),
  memberNumberFor: jest.fn(() => 'MF-001'),
}));
jest.mock('../src/services/whatsappService', () => ({
  sendMessage: jest.fn().mockResolvedValue(undefined),
  sendClubTemplate: jest.fn().mockResolvedValue(undefined),
}));

const { db } = require('./helpers/supabaseMock');
const { stkQuery } = require('../src/services/mpesaService');
const { sendMemberCard } = require('../src/services/memberCardService');
const {
  confirmCheckout,
  reconcilePendingPayments,
} = require('../src/services/paymentService');

function seedPendingPayment(overrides = {}) {
  db.seed('members', [{
    id: 'member-1',
    phone: '254700000001',
    name: 'Test Member',
    membership_status: 'pending',
    amount_paid: 0,
    ...overrides.member,
  }]);
  db.seed('payments', [{
    id: 'payment-1',
    member_id: 'member-1',
    phone: '254700000001',
    name: 'Test Member',
    tier: 'bronze',
    amount: 1000,
    method: 'mpesa',
    source: 'whatsapp',
    status: 'pending',
    checkout_request_id: 'checkout-1',
    created_at: new Date().toISOString(),
    ...overrides.payment,
  }]);
}

describe('M-Pesa payment confirmation and reconciliation', () => {
  beforeEach(() => {
    db.reset();
    jest.clearAllMocks();
  });

  test('a successful callback pays the payment and activates the member only once', async () => {
    seedPendingPayment();
    stkQuery.mockResolvedValue({ ResultCode: 0, ResultDesc: 'Success' });

    await expect(confirmCheckout('checkout-1', 'RECEIPT-1')).resolves.toBe('paid');
    await expect(confirmCheckout('checkout-1', 'RECEIPT-1')).resolves.toBe('ignored');

    expect(db.rows('payments')[0]).toMatchObject({
      status: 'paid',
      mpesa_receipt: 'RECEIPT-1',
    });
    expect(db.rows('members')[0]).toMatchObject({
      membership_status: 'active',
      tier: 'bronze',
      amount_paid: 1000,
    });
    expect(stkQuery).toHaveBeenCalledTimes(1);
    expect(sendMemberCard).toHaveBeenCalledTimes(1);
  });

  test('a failed callback marks the payment failed without activating the member', async () => {
    seedPendingPayment();
    stkQuery.mockResolvedValue({ ResultCode: 1032, ResultDesc: 'Cancelled by user' });

    await expect(confirmCheckout('checkout-1', null)).resolves.toBe('failed');

    expect(db.rows('payments')[0]).toMatchObject({
      status: 'failed',
      failure_reason: 'Cancelled by user',
    });
    expect(db.rows('members')[0].membership_status).toBe('pending');
    expect(sendMemberCard).not.toHaveBeenCalled();
  });

  test('a pending payment older than 15 minutes times out when M-Pesa remains unreachable', async () => {
    seedPendingPayment({
      payment: { created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
    });
    stkQuery.mockRejectedValue(new Error('Daraja unavailable'));

    await expect(reconcilePendingPayments()).resolves.toEqual(['failed']);

    expect(db.rows('payments')[0]).toMatchObject({
      status: 'failed',
      failure_reason: 'No response from M-Pesa',
    });
    expect(db.rows('members')[0].membership_status).toBe('pending');
    expect(sendMemberCard).not.toHaveBeenCalled();
  });
});
