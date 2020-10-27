const express = require('express');
const asyncHandler = require('express-async-handler');

const router = express.Router();
const userController = require('../controllers/user.controller');
const jwtConfig = require('../config/jwt.config');

/* === Create user. === */
router.post('/', asyncHandler(userController.createUser));

router.get('/me', jwtConfig.checkAuth, asyncHandler(userController.getCurrentUser));

router.put('/me', jwtConfig.checkAuth, asyncHandler(userController.updateCurrentUser));

module.exports = router;
