const fs = require('fs');
const { promisify } = require('util');
const db = require('../models');

const unlinkAsync = promisify(fs.unlink);

const ApplicationError = require('../error/applicationError');
const NotFoundError = require('../error/notFounterror');
const UnprocessableEntity = require('../error/unprocessableEntity');
const ForbiddenError = require('../error/forbiddenError');

const { itemSchema, putItemSchema, searchItemSchema } = require('../utils/itemValidationSchema');
const uploadFile = require('../utils/uploadFile').uploadFileMiddleware;
const { FILEPATH } = require('../utils/uploadFile');

const { Op } = db.Sequelize;
const User = db.users;
const Item = db.items;

exports.createItem = async (req, res) => {
  await validateCreateItem(req);

  const item = {
    title: req.body.title,
    price: req.body.price,
    userId: req.user.userId,
    image: `${FILEPATH}noPhoto.jpg`,
  };

  try {
    const newItem = await Item.create(item, {
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    });

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
      image: currentItem.image ? currentItem.image : null,
      userId: currentItem.userId,
      user: {
        id: currentItem.user.id,
        phone: currentItem.user.phone,
        name: currentItem.user.name,
        email: currentItem.user.email,
      },
    });
  } catch (e) {
    throw new ApplicationError(500);
  }
};

async function validateCreateItem(req) {
  try {
    await itemSchema.validateAsync(req.body);
  } catch (e) {
    const field = e.details[0].context.label;
    throw new UnprocessableEntity(field, e);
  }
}

exports.getCurrentItemById = async (req, res) => {
  const { id } = req.params;
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
      image: currentItem.image ? currentItem.image : null,
      userId: currentItem.userId,
      user: {
        id: currentItem.user.id,
        phone: currentItem.user.phone,
        name: currentItem.user.name,
        email: currentItem.user.email,
      },
    });
  } else {
    throw new NotFoundError();
  }
};

exports.getSearchItem = async (req, res) => {
  await validateGetSearchItem(req);

  const { title } = req.query;
  const { userId } = req.query;
  const orderBy = req.query.orderBy ? req.query.orderBy : 'createdAt';
  const orderType = req.query.orderType ? req.query.orderType : 'DESC';

  let condition = null;
  if (title && userId) {
    condition = { title: { [Op.like]: `%${title}%` }, userId };
  } else if (title) {
    condition = { title: { [Op.like]: `%${title}%` } };
  } else if (userId) {
    condition = { userId };
  }

  const foundItems = await Item.findAll({
    attributes: ['id', 'createdAt', 'title', 'price', 'image'],
    where: condition,
    include: [{ model: User, as: 'user', attributes: ['id', 'phone', 'name', 'email'] }],
    order: [[orderBy, orderType]],
  });

  if (foundItems[0]) {
    res.status(200).json({
      foundItems,
    });
  } else {
    throw new NotFoundError();
  }
};

async function validateGetSearchItem(req) {
  try {
    await searchItemSchema.validateAsync(req.query);
  } catch (e) {
    const field = e.details[0].context.label;
    throw new UnprocessableEntity(field, e);
  }
}

exports.updateCurrentItem = async (req, res) => {
  await validateUpdateCurrentItem(req);

  const authUserId = req.user.userId;
  const currentItemId = parseInt(req.params.id, 10);

  const currentItem = await Item.findOne({ where: { id: currentItemId }, include: [{ model: User, as: 'user' }] });
  if (!currentItem) {
    throw new NotFoundError();
  } else {
    const newItemData = {};
    if (authUserId === currentItem.user.id) {
      Object.keys(req.body).forEach((el) => {
        newItemData[el] = ['price', 'title'].includes(el) ? req.body[el] : null;
      });
      // Alternative option
      // if (req.body.title) {
      //   newItemData.title = req.body.title;
      // }
      // if (req.body.price) {
      //   newItemData.price = req.body.price;
      // }
    } else {
      throw new ForbiddenError();
    }

    try {
      const updateItem = await Item.update(newItemData, { where: { id: currentItemId } });
      if (updateItem) {
        res.status(200).json({
          id: currentItem.id,
          createdAt: currentItem.createdAt,
          title: newItemData.title || currentItem.title,
          price: newItemData.price || currentItem.price,
          image: currentItem.image ? updateItem.image : null,
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
      throw new ApplicationError(500);
    }
  }
};

async function validateUpdateCurrentItem(req) {
  try {
    await putItemSchema.validateAsync(req.query);
  } catch (e) {
    const field = e.details[0].context.label;
    throw new UnprocessableEntity(field, e);
  }
}

exports.updateCurrentItemImage = async (req, res) => {
  const authUserId = req.user.userId;
  const currentItemId = parseInt(req.params.id, 10);
  const currentItem = await Item.findOne({ where: { id: currentItemId }, include: [{ model: User, as: 'user' }] });

  if (!currentItem) {
    throw new NotFoundError();
  } else if (authUserId === currentItem.user.id) {
    await createItemImageModel(req, res, currentItemId, currentItem);
  } else {
    throw new ForbiddenError();
  }
};

async function createItemImageModel(req, res, currentItemId, currentItem) {
  try {
    await uploadFile(req, res);
    if (req.file === undefined) {
      throw new UnprocessableEntity('file', 'Please select a file');
    }
    console.log(req.file);
    await Item.update({ image: FILEPATH + req.file.filename }, { where: { id: currentItemId } });
    res.status(200).json({
      id: currentItem.id,
      createdAt: currentItem.createdAt,
      title: currentItem.title,
      price: currentItem.price,
      image: FILEPATH + req.file.filename,
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
  }
}

exports.deleteItem = async (req, res) => {
  const { id } = req.params;
  const authUserId = req.user.userId;

  const item = await Item.findByPk(id);
  if (item) {
    if (item.userId === authUserId) {
      await item.destroy();
      res.status(200).send();
    } else {
      throw new ForbiddenError();
    }
  } else {
    throw new NotFoundError();
  }
};

exports.deleteCurrentItemImage = async (req, res) => {
  const authUserId = req.user.userId;
  const currentItemId = parseInt(req.params.id, 10);
  const currentItem = await Item.findOne({ where: { id: currentItemId }, include: [{ model: User, as: 'user' }] });

  if (!currentItem) {
    throw new NotFoundError();
  }

  if (currentItem.image !== null) {
    if (currentItem.userId === authUserId) {
      await Item.update({ image: null }, { where: { id: currentItemId } });
      await unlinkAsync(currentItem.image);
      res.status(200).send();
    } else {
      throw new ForbiddenError();
    }
  } else {
    throw new NotFoundError();
  }
};
