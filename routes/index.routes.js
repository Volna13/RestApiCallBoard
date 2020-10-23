const express = require('express');

const router = express.Router();

const usersRouter = require('./users.routes');

/* GET home page. */
// router.get('/', function (req, res) {
//   res.render('index', { title: 'Express' });
// });
router.get('/', (req, res) => {
  res.send('index');
});

router.use('/users', usersRouter);

module.exports = router;
