const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/memberController');
const auth = require('../middleware/auth');

// Allow public read access to members list (for demo); require auth for mutations
router.get('/', ctrl.list);
router.post('/', auth, ctrl.create);
router.get('/:id', auth, ctrl.get);
router.put('/:id', auth, ctrl.update);
router.delete('/:id', auth, ctrl.remove);

module.exports = router;
