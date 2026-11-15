'use strict';

// Public: Safaricom calls this when a fan finishes (or cancels) the PIN prompt.
// It's public by necessity, so its contents are never trusted: confirmCheckout
// asks Safaricom directly before anything is activated.

const express = require('express');
const { confirmCheckout } = require('../services/paymentService');

const router = express.Router();

router.post('/callback', async (req, res) => {
  const callback = req.body?.Body?.stkCallback;
  const checkoutRequestId = callback?.CheckoutRequestID;

  try {
    if (typeof checkoutRequestId === 'string' && checkoutRequestId.length < 200) {
      const items = callback.CallbackMetadata?.Item || [];
      const receipt = items.find((item) => item.Name === 'MpesaReceiptNumber')?.Value;
      const outcome = await confirmCheckout(checkoutRequestId, typeof receipt === 'string' ? receipt : null);
      console.log(`M-Pesa callback ${checkoutRequestId}: ${outcome}`);
    }
  } catch (error) {
    // The background check will retry this payment, so nothing is lost.
    console.error('M-Pesa callback failed:', error.message);
  } finally {
    // Always acknowledge, or Safaricom keeps retrying.
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
});

module.exports = router;
