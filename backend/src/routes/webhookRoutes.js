const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/webhookController');

router.post('/', ctrl.handle);

module.exports = router;
