const joi = require('joi');

const itemSchema = joi.object({
  title: joi.string().min(6).max(100).trim().required(),
  price: joi.number().positive().precision(2).required(),
});

const putItemSchema = joi.object({
  title: joi.string().min(6).max(100).trim(),
  price: joi.number().positive().precision(2),
});

const searchItemSchema = joi.object({
  title: joi.string(),
  userId: joi.number(),
  orderBy: joi.string().valid('price', 'createdAt').empty('').default('createAt'),
  orderType: joi.string().valid('asc', 'desc').empty('').default('desc'),
});

module.exports = {
  itemSchema,
  putItemSchema,
  searchItemSchema,
};
