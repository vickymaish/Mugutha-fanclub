const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/whatsappController');

router.post('/send-test', ctrl.sendTest);
router.post('/send-template', ctrl.sendTemplateTest);

module.exports = router;