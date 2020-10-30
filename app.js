const express = require('express');
const path = require('path');

const db = require('./models');

const indexRouter = require('./routes/index.routes');

const ApplicationError = require('./error/applicationError');
const UnprocessableEntityError = require('./error/unprocessableEntity');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/', (req, res) => {
  res.send('index');
});
app.use('/api', indexRouter);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof UnprocessableEntityError) {
    res.status(err.getStatus()).json({
      field: err.getField(),
      message: err.message,
    });
  } else if (err instanceof ApplicationError) {
    res.status(err.getStatus()).send();
  } else {
    res.status(500).send();
  }
});

app.use(function (req, res) {
  res.status(404).json({
    message: 'error 404',
  });
});

db.sequelize.sync();

module.exports = app;
