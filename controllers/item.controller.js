// eslint-disable-next-line import/order
const db = require('../models');

const fs = require('fs');
const { promisify } = require('util');

const unlinkAsync = promisify(fs.unlink);

const ApplicationError = require('../error/applicationError');
const NotFoundError = require('../error/notFounterror');
const UnprocessableEntity = require('../error/unprocessableEntity');
const ForbiddenError = require('../error/forbiddenError');

const { itemSchema, putItemSchema } = require('../utils/itemValidationSchema');
const uploadFile = require('../utils/uploadFile');

const { Op } = db.Sequelize;
const User = db.users;
const Item = db.items;

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
    image: '/home/sanya_kamputer/WebstormProjects/restApiCallBoard/public/images/noPhoto.jpg',
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

// not work.
/* === SEARCH ITEM === */
exports.getSearchItem = async (req, res) => {
  const { title } = req.query;
  const { userId } = req.query;

  let condition = null;
  if (title && userId) {
    condition = { title: { [Op.like]: `%${title}%` }, userId };
  } else if (title) {
    condition = { title: { [Op.like]: `%${title}%` } };
  } else if (userId) {
    condition = { userId };
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

/* === UPDATE CURRENT ITEM BY ID === */
// eslint-disable-next-line no-unused-vars
exports.updateCurrentItem = async (req, res, next) => {
  const authUserId = req.user.userId;
  const currentItemId = parseInt(req.params.id, 10);
  // validate request
  try {
    await putItemSchema.validateAsync(req.body);
  } catch (e) {
    const field = e.details[0].context.label;
    throw new UnprocessableEntity(field, e);
  }

  const currentItem = await Item.findOne({ where: { id: currentItemId }, include: [{ model: User, as: 'user' }] });
  if (!currentItem) {
    throw new NotFoundError();
  } else {
    // CREATE ITEM UPDATE MODEL
    const newItemData = {};
    if (authUserId === currentItem.user.id) {
      Object.keys(req.body).forEach((el) => {
        newItemData[el] = ['price', 'title'].includes(el) ? req.body[el] : null;
      });
      // if (req.body.title) {
      //   newItemData.title = req.body.title;
      // }
      // if (req.body.price) {
      //   newItemData.price = req.body.price;
      // }
    } else {
      throw new ForbiddenError('');
    }
    // ADD UPDATE MODEL TO DB
    try {
      const updateItem = await Item.update(newItemData, { where: { id: currentItemId } });
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

exports.updateCurrentItemImage = async (req, res) => {
  const authUserId = req.user.userId;
  const currentItemId = parseInt(req.params.id, 10);
  const currentItem = await Item.findOne({ where: { id: currentItemId }, include: [{ model: User, as: 'user' }] });

  if (!currentItem) {
    throw new NotFoundError();
  } else if (authUserId === currentItem.user.id) {
    // CREATE ITEM IMAGE UPDATE MODEL
    await createItemImageModel(req, res, currentItemId, currentItem);
  } else {
    throw new ForbiddenError();
  }
};

async function createItemImageModel(req, res, currentItemId, currentItem) {
  try {
    await uploadFile(req, res);
    if (req.file === undefined) {
      throw new NotFoundError();
    }
    await Item.update({ image: req.file.path }, { where: { id: currentItemId } });
    res.status(200).json({
      id: currentItem.id,
      createdAt: currentItem.createdAt,
      title: currentItem.title,
      price: currentItem.price,
      image: req.file.path ? req.file.path : 'not found',
      userId: currentItem.userId,
      user: {
        id: currentItem.user.id,
        phone: currentItem.user.phone,
        name: currentItem.user.name,
        email: currentItem.user.email,
      },
    });
  } catch (e) {
    if (e.code === 'LIMIT_FILE_SIZE') {
      throw new UnprocessableEntity('File', 'File size cannot be larger than 2MB!');
    }
    throw new ApplicationError('Some error occurred while updating item image.', 500);
  }
}

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

exports.deleteCurrentItemImage = async (req, res) => {
  const authUserId = req.user.userId;
  const currentItemId = parseInt(req.params.id, 10);
  const currentItem = await Item.findOne({ where: { id: currentItemId }, include: [{ model: User, as: 'user' }] });

  if (!currentItem) {
    throw new NotFoundError('Item not found');
  }

  if (currentItem.image !== 'not found' || null) {
    if (currentItem.userId === authUserId) {
      await Item.update({ image: 'not found' }, { where: { id: currentItemId } });
      await unlinkAsync(currentItem.image);
      res.status(200).send();
    } else {
      throw new ForbiddenError();
    }
  } else {
    throw new NotFoundError('Item not found');
  }
};
