const express = require('express');
const asyncHandler = require('express-async-handler');

const router = express.Router();
const userController = require('../controllers/user.controller');
const itemController = require('../controllers/item.controller');

const jwtConfig = require('../config/jwt.config');

/* === Create user. === */
router.post('/', jwtConfig.checkAuth, asyncHandler(itemController.createItem));

router.get('/:id', asyncHandler(itemController.getCurrentItemById));

router.get('/', asyncHandler(userController.getSearchUsers));

router.put('/me', jwtConfig.checkAuth, asyncHandler(userController.updateCurrentUser));

module.exports = router;
