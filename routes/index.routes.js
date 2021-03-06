const express = require('express');
const asyncHandler = require('express-async-handler');

const router = express.Router();

const usersRouter = require('./users.routes');
const itemRouter = require('./items.routes');

const userController = require('../controllers/user.controller');

router.post('/', asyncHandler(userController.loginUser));

router.use('/users', usersRouter);

router.use('/items', itemRouter);

module.exports = router;
