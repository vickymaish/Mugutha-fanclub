'use strict';

const mockCallOrder = [];

jest.mock('../src/config/env', () => ({
  whatsapp: { phoneNumberId: '', apiToken: '' },
}));
jest.mock('../src/config/supabase', () => require('./helpers/supabaseMock').supabase);
jest.mock('../src/services/optOut', () => ({
  handle: jest.fn(async () => {
    mockCallOrder.push('optOut');
    return false;
  }),
}));
jest.mock('../src/services/joinFlow', () => ({
  handle: jest.fn(async () => {
    mockCallOrder.push('joinFlow');
    return true;
  }),
}));

const webhookController = require('../src/controllers/webhookController');

describe('webhook command handling order', () => {
  beforeEach(() => {
    mockCallOrder.length = 0;
  });

  test('checks opt-out commands before dispatching to join flow', async () => {
    const response = { sendStatus: jest.fn() };
    const request = {
      body: {
        entry: [{
          changes: [{
            value: {
              messages: [{ from: '254700000001', text: { body: 'JOIN' }, type: 'text' }],
            },
          }],
        }],
      },
    };

    await webhookController.handle(request, response);

    expect(mockCallOrder).toEqual(['optOut', 'joinFlow']);
  });

  test('join flow cancel words do not include STOP', () => {
    const fs = require('fs');
    const path = require('path');
    const joinFlowSource = fs.readFileSync(
      path.join(__dirname, '../src/services/joinFlow.js'),
      'utf8',
    );

    expect(joinFlowSource).toMatch(/CANCEL_WORDS\s*=\s*\/\^\(cancel\|acha\|menu\)\$/i);
  });
});
