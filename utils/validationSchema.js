const joi = require('joi');

const regSchema = joi.object({
  name: joi.string().trim().required(),
  email: joi.string().email().lowercase().trim().required(),
  password: joi.string().min(3).max(30).trim().required(),
  phone: joi.string().min(10).max(13).trim().required(),
});

module.exports = {
  regSchema,
};
