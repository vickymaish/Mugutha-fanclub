const express = require('express');
const router = express.Router();
const fixtureController = require('../controllers/fixtureController');

// GET all fixtures
router.get('/', fixtureController.getAllFixtures);

// GET single fixture
router.get('/:id', fixtureController.getFixtureById);

// POST create fixture
router.post('/', fixtureController.createFixture);

// PUT update fixture
router.put('/:id', fixtureController.updateFixture);

// DELETE fixture
router.delete('/:id', fixtureController.deleteFixture);

// Match-day alert: preview (message, weather, recipients), then send.
router.get('/:id/alert-preview', fixtureController.previewFixtureAlert);
router.post('/:id/alert', fixtureController.sendFixtureAlert);

module.exports = router;