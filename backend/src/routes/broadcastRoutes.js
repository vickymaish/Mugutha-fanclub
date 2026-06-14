const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/broadcastController');
const auth = require('../middleware/auth');

router.get('/', auth, ctrl.list);
router.post('/', auth, ctrl.create);
router.post('/send', ctrl.sendBroadcast);

module.exports = router;
