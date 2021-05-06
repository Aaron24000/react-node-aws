const express = require('express');
const router = express.Router();

// Import validators
const {userRegisterValidator} = require('../validators/auth');
const {runValidation} = require('../validators');

// import from controllers
const { register } = require('../controllers/auth');

router.post('/register', userRegisterValidator, runValidation, register);

module.exports = router;