const db = require('../models');

const ApplicationError = require('../error/applicationError');
const NotFoundError = require('../error/notFounterror');
const UnprocessableEntity = require('../error/unprocessableEntity');
const ForbiddenError = require('../error/forbiddenError');

const User = db.users;
const Item = db.items;

const { itemSchema, putItemSchema } = require('../utils/itemValidationSchema');

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

// need fix associated with error 404!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
/* === GET ITEM BY ID === */
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

/* === UPDATE CURRENT ITEM BY ID === */
// eslint-disable-next-line no-unused-vars
exports.updateCurrentItem = async (req, res, next) => {
  // validate request
  try {
    await putItemSchema.validateAsync(req.body);
  } catch (e) {
    const field = e.details[0].context.label;
    throw new UnprocessableEntity(field, e);
  }

  const authUserId = req.user.userId;
  const currentItemId = parseInt(req.params.id, 10);

  const currentItem = await Item.findOne({
    where: { id: currentItemId },
    include: [
      {
        model: User,
        as: 'user',
      },
    ],
  });

  if (!currentItem) {
    throw new NotFoundError();
  } else {
    // CREATE ITEM UPDATE MODEL
    const newItemData = {};
    if (authUserId === currentItem.user.id) {
      if (req.body.title) {
        newItemData.title = req.body.title;
      }
      if (req.body.price) {
        newItemData.price = req.body.price;
      }
    } else {
      throw new ForbiddenError('');
    }

    try {
      const updateItem = await Item.update(newItemData, {
        where: { id: currentItemId },
        include: [
          {
            model: User,
            as: 'user',
          },
        ],
      });
      console.log(updateItem);

      if (updateItem) {
        res.status(200).json({
          id: currentItem.id,
          createdAt: currentItem.createdAt,
          title: newItemData.title || currentItem.title,
          price: newItemData.price || currentItem.price,
          image: currentItem.image ? updateItem.image : 'not found',
          userId: currentItem.userId,
          user: {
            id: currentItem.user.id,
            phone: currentItem.user.phone,
            name: currentItem.user.name,
            email: currentItem.user.email,
          },
        });
      }
    } catch (e) {
      throw new ApplicationError('Some error occurred while updating item.', 500);
    }
  }
};

exports.deleteItem = async (req, res) => {
  const { id } = req.params;
  const authUserId = req.user.userId;

  const candidateItem = await Item.findByPk(id);
  if (candidateItem) {
    if (candidateItem.userId === authUserId) {
      await candidateItem.destroy();
      res.status(200).send();
    } else {
      throw new ForbiddenError();
    }
  } else {
    throw new NotFoundError('User not found');
  }
};
