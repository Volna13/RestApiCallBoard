const express = require('express');
const asyncHandler = require('express-async-handler');

const router = express.Router();

const usersRouter = require('./users.routes');
const userController = require('../controllers/user.controller');

/* GET home page. */
// router.get('/', function (req, res) {
//   res.render('index', { title: 'Express' });
// });
router.post('/', asyncHandler(userController.loginUser));

router.use('/users', usersRouter);

module.exports = router;