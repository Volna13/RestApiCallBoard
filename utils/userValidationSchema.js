const joi = require('joi');

const regSchema = joi.object({
  name: joi.string().trim().required(),
  email: joi.string().email().lowercase().trim().required(),
  password: joi.string().min(3).max(30).required(),
  newPassword: joi.string().min(3).max(30),
  phone: joi.string().min(10).max(13).trim().required(),
});

const loginSchema = joi.object({
  email: joi.string().email().lowercase().trim().required(),
  password: joi.string().min(3).max(30).trim().required(),
});

const putUserSchema = joi.object({
  name: joi.string().trim(),
  email: joi.string().email().lowercase().trim(),
  currentPassword: joi.string().max(30),
  newPassword: joi.string().min(3).max(30),
  phone: joi.string().min(10).max(13).trim(),
});

module.exports = {
  regSchema,
  putUserSchema,
  loginSchema,
};
