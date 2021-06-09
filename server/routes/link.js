const express = require('express');
const router = express.Router();

// validators
const { linkCreateValidator, linkUpdateValidator } = require('../validators/link');
const { runValidation } = require('../validators/');

// import from controllers
const { requireSignin, authMiddleware } = require('../controllers/auth');
const { create, list, read, update, remove } = require('../controllers/link');

// routes
router.post('/link', linkCreateValidator, runValidation, requireSignin, authMiddleware, create);
router.get('/link', list);
router.get('/link:slug', read);
router.put('/link:slug', linkUpdateValidator, runValidation, requireSignin, authMiddleware, update);
router.delete('/link:slug', requireSignin, authMiddleware, remove);

module.exports = router;