const db = require('../models');

const ApplicationError = require('../error/applicationError');
const NotFoundError = require('../error/notFounterror');
const UnprocessableEntity = require('../error/unprocessableEntity');

const User = db.users;
const Item = db.items;

const { itemSchema } = require('../utils/itemValidationSchema');

// eslint-disable-next-line no-unused-vars
exports.createItem = async (req, res, next) => {
  // VALIDATE REQUEST
  try {
    await itemSchema.validateAsync(req.body);
  } catch (e) {
    const field = e.details[0].context.label;
    throw new UnprocessableEntity(field, e);
  }

  // CREATE ITEM MODEL
  const item = {
    title: req.body.title,
    price: req.body.price,
    userId: req.user.userId,
  };
  try {
    // push item in db
    const newItem = await Item.create(item, {
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    });

    // get created item of db
    const currentItem = await Item.findByPk(newItem.id, {
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    });
    res.status(200).json({
      id: currentItem.id,
      createdAt: currentItem.createdAt,
      title: currentItem.title,
      price: currentItem.price,
      image: currentItem.image ? currentItem.image : 'not found',
      userId: currentItem.userId,
      user: {
        id: currentItem.user.id,
        phone: currentItem.user.phone,
        name: currentItem.user.name,
        email: currentItem.user.email,
      },
    });
  } catch (e) {
    throw new ApplicationError('Some error occurred while creating Item.', 500);
  }
};

// need fix associated with error 404!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!S
exports.getCurrentItemById = async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    const currentItem = await Item.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    });

    if (currentItem) {
      res.status(200).json({
        id: currentItem.id,
        createdAt: currentItem.createdAt,
        title: currentItem.title,
        price: currentItem.price,
        image: currentItem.image ? currentItem.image : 'not found',
        userId: currentItem.userId,
        user: {
          id: currentItem.user.id,
          phone: currentItem.user.phone,
          name: currentItem.user.name,
          email: currentItem.user.email,
        },
      });
    } else {
      throw new NotFoundError('Item not found');
    }
  } catch (e) {
    console.log(e);
    throw new ApplicationError('Some error occurred while retrieving item', 500);
  }
};
