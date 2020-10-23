const express = require('express');
const asyncHandler = require('express-async-handler');

const router = express.Router();
const userController = require('../controllers/user.controller');

/* === Create user. === */
router.post('/', asyncHandler(userController.createUser));

module.exports = router;
