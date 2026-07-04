const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/memberController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', ctrl.list);

// ⚠️ Must come BEFORE /:id — otherwise Express treats "tierCounts" as an ID
router.get('/tierCounts', ctrl.tierCounts);

// Auth-protected routes
router.post('/', auth, ctrl.create);
router.get('/:id', auth, ctrl.get);
router.put('/:id', auth, ctrl.update);
router.delete('/:id', auth, ctrl.remove);

// Send personalized WhatsApp welcome card
router.post('/:id/send-card', ctrl.sendWelcomeCard);

module.exports = router;