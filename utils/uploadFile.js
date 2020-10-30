const util = require('util');
const multer = require('multer');

const FILE_PATH = '/public/images/';
const maxSize = 2 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `${__dirname}/..${FILE_PATH}`);
  },
  filename: (req, file, cb) => {
    let filetype = '';
    if (file.mimetype === 'image/gif') {
      filetype = 'gif';
    }
    if (file.mimetype === 'image/png') {
      filetype = 'png';
    }
    if (file.mimetype === 'image/jpeg') {
      filetype = 'jpg';
    }
    cb(null, `image-${Date.now()}.${filetype}`);
  },
});
const uploadFile = multer({
  storage,
  limits: { fileSize: maxSize },
}).single('file');

const uploadFileMiddleware = util.promisify(uploadFile);
module.exports.uploadFileMiddleware = uploadFileMiddleware;
module.exports.FILEPATH = FILE_PATH;
