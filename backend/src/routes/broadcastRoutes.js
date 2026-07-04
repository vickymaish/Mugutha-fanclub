const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/broadcastController');
const auth = require('../middleware/auth');

// Public GET – no auth needed for analytics
router.get('/', ctrl.list);  // ← REMOVED auth for now
router.post('/', auth, ctrl.create);
router.post('/send', ctrl.sendBroadcast);

module.exports = router;