const express = require('express');
const asyncHandler = require('express-async-handler');

const router = express.Router();
const userController = require('../controllers/user.controller');
const jwtConfig = require('../utils/jwt.config');

router.post('/', asyncHandler(userController.createUser));

router.get('/me', jwtConfig.checkAuth, asyncHandler(userController.getCurrentUser));

router.get('/:id', jwtConfig.checkAuth, asyncHandler(userController.getCurrentUserById));

router.get('/', asyncHandler(userController.getSearchUsers));

router.put('/me', jwtConfig.checkAuth, asyncHandler(userController.updateCurrentUser));

module.exports = router;
