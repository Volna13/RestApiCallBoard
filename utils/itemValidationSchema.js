const joi = require('joi');

const itemSchema = joi.object({
  title: joi.string().min(6).max(100).trim().required(),
  price: joi.number().positive().precision(2).required(),
});

const putItemSchema = joi.object({
  title: joi.string().min(6).max(100).trim(),
  price: joi.number().positive().precision(2),
});

module.exports = {
  itemSchema,
  putItemSchema,
};
