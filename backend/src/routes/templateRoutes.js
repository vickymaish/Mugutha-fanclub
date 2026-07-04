const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/templateController');

// GET all templates (optional tier filter)
router.get('/', ctrl.list);

// GET single template by ID
router.get('/:id', ctrl.getById);

// POST create template
router.post('/', ctrl.create);

// PUT update template
router.put('/:id', ctrl.update);

// DELETE template
router.delete('/:id', ctrl.delete);

module.exports = router;