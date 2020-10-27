const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const db = require('./models');

const indexRouter = require('./routes/index.routes');

const ApplicationError = require('./error/applicationError');
const UnprocessableEntityError = require('./error/unprocessableEntity');

const app = express();

app.use(logger('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/', (req, res) => {
  res.send('index');
});
app.use('/api', indexRouter);

/* === ERROR handler === */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  if (err instanceof UnprocessableEntityError) {
    console.log('UnprocessableEntityError!!');
    res.status(err.getStatus()).json({
      field: err.getField(),
      message: err.message,
    });
  } else if (err instanceof ApplicationError) {
    console.log('ApplicationError!!');
    res.status(err.getStatus()).json({
      message: err.message,
    });
  } else {
    console.log('else error 500!!', err);
    res.status(500).json({
      errorMsg: err.message,
    });
  }
});

// app.use(function (req, res) {
//   res.status(404).json({
//     message: 'error 404',
//   });
// });

// sync DB
db.sequelize.sync();

module.exports = app;
