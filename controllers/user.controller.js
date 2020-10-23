const bcrypt = require('bcryptjs');

const db = require('../models');

const ApplicationError = require('../error/applicationError');
const UnprocessableEntity = require('../error/unprocessableEntity');

const User = db.users;
const { regSchema } = require('../utils/validationSchema');

// Create and Save a new User
// eslint-disable-next-line no-unused-vars
exports.createUser = async (req, res, next) => {
  // validate request
  try {
    await regSchema.validateAsync(req.body);
  } catch (e) {
    console.log(e);
    throw new UnprocessableEntity('Field', e);
  }

  // create user model
  const salt = bcrypt.genSaltSync(10);
  const user = {
    name: req.body.name,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, salt),
    phone: req.body.phone,
  };

  const doesExist = await User.findOne({ where: { email: req.body.email } });
  if (doesExist) {
    throw new UnprocessableEntity('Email', `Email "${req.body.email}" already is in use`);
  } else {
    try {
      // save user in DB
      User.create(user);
      res.status(201).send(user);
    } catch (e) {
      throw new ApplicationError('Some error occurred while creating User.', 500);
    }
  }
};
