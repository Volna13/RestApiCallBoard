const joi = require('joi');

const itemSchema = joi.object({
  title: joi.string().min(6).max(100).trim().required(),
  price: joi.number().positive().precision(2).required(),
});

module.exports = {
  itemSchema,
};
