const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/webhookController');

router.get('/', ctrl.verify);

router.post('/', ctrl.handle);

module.exports = router;