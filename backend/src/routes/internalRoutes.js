const express = require('express');
const router = express.Router();

/**
 * Mock WhatsApp Provider Endpoint
 * Simulates a WhatsApp delivery service for local testing and demo.
 * 
 * Configurable via MOCK_WHATSAPP_DELAY_MS env var (default: 2000ms)
 * Example: MOCK_WHATSAPP_DELAY_MS=5000 (simulate 5 second network delay)
 * 
 * Endpoint: POST /internal/mock-whatsapp
 * Request body:
 *   - to: recipient phone (optional, echoed back)
 *   - message: message text (optional)
 *   - delay: override delay in ms (optional)
 * 
 * Response:
 *   { id: "mock-<timestamp>", to: <phone>, status: "queued" }
 */
router.post('/mock-whatsapp', async (req, res) => {
  const { to, message, delay } = req.body || {};
  
  // Use override delay if provided, otherwise read from env
  const delayMs = typeof delay === 'number' 
    ? delay 
    : parseInt(process.env.MOCK_WHATSAPP_DELAY_MS || '2000', 10);

  // Log for debugging
  console.log(`[MOCK] WhatsApp send requested: to=${to}, delay=${delayMs}ms`);

  // Simulate processing delay before responding
  setTimeout(() => {
    const mockId = `mock-${Date.now()}`;
    const response = {
      id: mockId,
      to: to || null,
      status: 'queued',
      timestamp: new Date().toISOString(),
    };
    
    console.log(`[MOCK] Responding with: ${JSON.stringify(response)}`);
    res.json(response);
  }, delayMs);
});

module.exports = router;
