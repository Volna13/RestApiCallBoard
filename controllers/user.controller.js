const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');
const { salt } = require('../config/jwt.config');

const db = require('../models');

const { Op } = db.Sequelize;

const ApplicationError = require('../error/applicationError');
const NotFoundError = require('../error/notFounterror');
const UnprocessableEntity = require('../error/unprocessableEntity');
const UnauthorizedError = require('../error/unauthorizedError');

const User = db.users;
const { regSchema, loginSchema, putUserSchema } = require('../utils/userValidationSchema');

/* === POST NEW USER === */
// eslint-disable-next-line no-unused-vars
exports.createUser = async (req, res, next) => {
  // VALIDATE REQUEST
  try {
    await regSchema.validateAsync(req.body);
  } catch (e) {
    const field = e.details[0].context.label;
    throw new UnprocessableEntity(field, e);
  }

  // CREATE USER MODEL
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
      await User.create(user);

      await loginUser(req, res, req.body.email, req.body.password);
    } catch (e) {
      throw new ApplicationError('Some error occurred while creating User.', 500);
    }
  }
};

/* === POST LOGIN USER === */
exports.loginUser = async (req, res) => {
  try {
    // Validate request
    await loginSchema.validateAsync(req.body);
  } catch (e) {
    const field = e.details[0].context.label;
    throw new UnprocessableEntity(field, e);
  }

  await loginUser(req, res, req.body.email, req.body.password);
};

async function loginUser(req, res, email, password) {
  const candidate = await User.findOne({ where: { email } });
  if (candidate) {
    // compare Password
    const pwdResult = bcrypt.compareSync(password, candidate.password);
    if (pwdResult) {
      await authUser(req, res, candidate);
    } else {
      throw new UnprocessableEntity('Password', 'Password do not match');
    }
  } else {
    throw new NotFoundError('User not found');
  }
}

async function authUser(req, res, candidate) {
  // JWT generation
  const token = jwt.sign(
    {
      userId: candidate.id,
      email: candidate.email,
    },
    jwtConfig.JWT_SECRET,
    { expiresIn: 60 * 60 },
  );

  res.status(200).send({
    token,
  });
}

/* === GET CURRENT USER === */
exports.getCurrentUser = async (req, res) => {
  const id = req.user.userId;
  try {
    const currentUser = await User.findByPk(id);
    if (!currentUser) {
      throw new UnauthorizedError('Unauthorized');
    } else {
      res.status(200).json({
        id: currentUser.id,
        phone: currentUser.phone,
        name: currentUser.name,
        email: currentUser.email,
      });
    }
  } catch (e) {
    throw new ApplicationError('Some error occurred while retrieving user', 500);
  }
};

/* === PUT UPDATE USER === */
// eslint-disable-next-line no-unused-vars
exports.updateCurrentUser = async (req, res, next) => {
  const id = req.user.userId;
  const currentUser = await User.findOne({ where: { id } });
  // validate request
  try {
    await putUserSchema.validateAsync(req.body);
  } catch (e) {
    const field = e.details[0].context.label;
    throw new UnprocessableEntity(field, e);
  }

  // create user update model
  const newUserData = await createNewUserData(req, res, next, currentUser, salt);

  try {
    const updateUser = await User.update(newUserData, { where: { id } });
    if (updateUser) {
      res.status(200).json({
        id,
        phone: newUserData.phone || currentUser.phone,
        name: newUserData.name || currentUser.name,
        email: newUserData.email || currentUser.email,
      });
    }
  } catch (e) {
    throw new ApplicationError('Some error occurred while updating User.', 500);
  }
};

async function createNewUserData(req, res, next, currentUser, salt) {
  // const salt = bcrypt.genSaltSync(10);
  const newUserData = {};
  if (req.body.name) {
    newUserData.name = req.body.name;
  }
  if (req.body.email) {
    newUserData.email = req.body.email;
  }
  if (req.body.phone) {
    newUserData.phone = req.body.phone;
  }
  if (req.body.currentPassword) {
    if (req.body.newPassword) {
      if (bcrypt.compareSync(req.body.currentPassword, currentUser.password)) {
        // pwd true
        newUserData.newPassword = bcrypt.hashSync(req.body.newPassword, salt);
      } else {
        // pwd false
        throw new UnprocessableEntity('Current Password', 'Password do not match');
      }
    } else {
      throw new UnprocessableEntity('new Password', 'This field cannot be empty');
    }
  }
  return newUserData;
}

/* === GET CURRENT USER BY ID === */
exports.getCurrentUserById = async (req, res) => {
  const { id } = req.params;
  const idAuth = req.user.userId;
  try {
    const authUser = await User.findByPk(idAuth);
    if (!authUser) {
      throw new UnauthorizedError('Unauthorized');
    } else {
      const currentUser = await User.findByPk(id);
      res.status(200).json({
        id: currentUser.id,
        phone: currentUser.phone,
        name: currentUser.name,
        email: currentUser.email,
      });
    }
  } catch (e) {
    throw new ApplicationError('Some error occurred while retrieving user', 500);
  }
};

/* === SEARCH USERS === */
exports.getSearchUsers = async (req, res) => {
  const { name } = req.query;
  const { email } = req.query;

  let condition = null;
  if (name && email) {
    condition = { name: { [Op.like]: `%${name}%` }, email: { [Op.like]: `%${email}%` } };
  } else if (name) {
    condition = { name: { [Op.like]: `%${name}%` } };
  } else if (email) {
    condition = { email: { [Op.like]: `%${email}%` } };
  }

  const foundUsers = await User.findAll({ attributes: ['id', 'phone', 'name', 'email'], where: condition });
  if (foundUsers[0]) {
    res.status(200).json({
      foundUsers,
    });
  } else {
    throw new NotFoundError('User not found');
  }
};
