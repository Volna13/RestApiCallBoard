const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../utils/jwt.config');
const { salt } = require('../utils/jwt.config');

const db = require('../models');

const { Op } = db.Sequelize;

const ApplicationError = require('../error/applicationError');
const NotFoundError = require('../error/notFounterror');
const UnprocessableEntity = require('../error/unprocessableEntity');
const UnauthorizedError = require('../error/unauthorizedError');

const User = db.users;
const { regSchema, loginSchema, putUserSchema } = require('../utils/userValidationSchema');

exports.createUser = async (req, res) => {
  await validateCreateUser(req);

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
      await User.create(user);
      await loginUser(req, res, req.body.email, req.body.password);
    } catch (e) {
      throw new ApplicationError(500);
    }
  }
};

async function validateCreateUser(req) {
  try {
    await regSchema.validateAsync(req.body);
  } catch (e) {
    const field = e.details[0].context.label;
    throw new UnprocessableEntity(field, e);
  }
}

exports.loginUser = async (req, res) => {
  await validateLoginUser(req);
  await loginUser(req, res, req.body.email, req.body.password);
};

async function validateLoginUser(req) {
  try {
    await loginSchema.validateAsync(req.body);
  } catch (e) {
    const field = e.details[0].context.label;
    throw new UnprocessableEntity(field, e);
  }
}

async function loginUser(req, res, email, password) {
  const candidate = await User.findOne({ where: { email } });
  if (candidate) {
    const pwdResult = bcrypt.compareSync(password, candidate.password);
    if (pwdResult) {
      await authUser(req, res, candidate);
    } else {
      throw new UnprocessableEntity('Password', 'Password do not match');
    }
  } else {
    throw new NotFoundError();
  }
}

async function authUser(req, res, candidate) {
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

exports.getCurrentUser = async (req, res) => {
  const id = req.user.userId;
  const currentUser = await User.findByPk(id);
  if (!currentUser) {
    throw new UnauthorizedError();
  } else {
    res.status(200).json({
      id: currentUser.id,
      phone: currentUser.phone,
      name: currentUser.name,
      email: currentUser.email,
    });
  }
};

exports.updateCurrentUser = async (req, res, next) => {
  await validateUpdateUser(req);
  const id = req.user.userId;
  const currentUser = await User.findOne({ where: { id } });
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
    throw new ApplicationError(500);
  }
};

async function validateUpdateUser(req) {
  try {
    await putUserSchema.validateAsync(req.body);
  } catch (e) {
    const field = e.details[0].context.label;
    throw new UnprocessableEntity(field, e);
  }
}

async function createNewUserData(req, res, next, currentUser, salt) {
  const newUserData = {};
  Object.keys(req.body).forEach((el) => {
    newUserData[el] = ['name', 'email', 'phone'].includes(el) ? req.body[el] : null;
  });
  if (bcrypt.compareSync(req.body.currentPassword, currentUser.password)) {
    newUserData.newPassword = bcrypt.hashSync(req.body.newPassword, salt);
  } else {
    throw new UnprocessableEntity('Current Password', 'Password do not match');
  }
  return newUserData;
}

exports.getCurrentUserById = async (req, res) => {
  const { id } = req.params;
  const idAuth = req.user.userId;
  const authUser = await User.findByPk(idAuth);

  if (!authUser) {
    throw new UnauthorizedError();
  } else {
    const currentUser = await User.findByPk(id);
    res.status(200).json({
      id: currentUser.id,
      phone: currentUser.phone,
      name: currentUser.name,
      email: currentUser.email,
    });
  }
};

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
    throw new NotFoundError();
  }
};
