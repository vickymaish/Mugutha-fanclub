const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/webhookController');
const verifyMetaSignature = require('../middleware/verifyMetaSignature');

router.get('/', ctrl.verify);

router.post('/', verifyMetaSignature, ctrl.handle);

module.exports = router;