const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');

const db = require('../models');

const ApplicationError = require('../error/applicationError');
const NotFoundError = require('../error/notFounterror');
const UnprocessableEntity = require('../error/unprocessableEntity');

const User = db.users;
const { regSchema, loginSchema } = require('../utils/validationSchema');

// Create and Save a new User
// eslint-disable-next-line no-unused-vars
exports.createUser = async (req, res, next) => {
  // validate request
  try {
    await regSchema.validateAsync(req.body);
  } catch (e) {
    const field = e.details[0].context.label;
    throw new UnprocessableEntity(field, e);
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
      await authUser(req, res, user);
    } catch (e) {
      throw new ApplicationError('Some error occurred while creating User.', 500);
    }
  }
};

exports.loginUser = async (req, res) => {
  try {
    // Validate request
    await loginSchema.validateAsync(req.body);
  } catch (e) {
    const field = e.details[0].context.label;
    throw new UnprocessableEntity(field, e);
  }

  const candidate = await User.findOne({ where: { email: req.body.email } });
  if (candidate) {
    // compare Password
    const pwdResult = bcrypt.compareSync(req.body.password, candidate.password);
    if (pwdResult) {
      await authUser(req, res, candidate);
    } else {
      throw new UnprocessableEntity('Password', 'Password do not match');
    }
  } else {
    throw new NotFoundError('User not found');
  }
};

async function authUser(req, res, candidate) {
  // JWT generation
  const token = jwt.sign(
    {
      email: candidate.email,
      userId: candidate.id,
    },
    jwtConfig.JWT_SECRET,
    { expiresIn: 60 * 60 },
  );

  res.status(200).send({
    token,
  });
}
