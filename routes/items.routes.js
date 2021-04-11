const express = require('express');
const asyncHandler = require('express-async-handler');

const router = express.Router();

const itemController = require('../controllers/item.controller');

const jwtConfig = require('../utils/jwt.config');

router.post('/', jwtConfig.checkAuth, asyncHandler(itemController.createItem));

router.delete('/:id', jwtConfig.checkAuth, asyncHandler(itemController.deleteItem));

router.get('/:id', asyncHandler(itemController.getCurrentItemById));

router.get('/', asyncHandler(itemController.getSearchItem));

router.put('/:id', jwtConfig.checkAuth, asyncHandler(itemController.updateCurrentItem));

router.post('/:id/image', jwtConfig.checkAuth, asyncHandler(itemController.updateCurrentItemImage));

router.delete('/:id/image', jwtConfig.checkAuth, asyncHandler(itemController.deleteCurrentItemImage));

router.delete(
  '/deleteWithSaveImg/:idOld/:idNew',
  jwtConfig.checkAuth,
  asyncHandler(itemController.deleteItemWithSavingImage),
);

module.exports = router;
