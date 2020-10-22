const joi = require("joi");

const regSchema = joi.object({
  firstname: joi.string().trim().required(),
  lastname: joi.string().trim().required(),
  email: joi.string().email().lowercase().trim().required(),
  password: joi.string().min(3).max(30).trim().required(),
  phone: joi.number().integer().greater(6).max(120).required(),
});

module.exports = {
  regSchema,
};
