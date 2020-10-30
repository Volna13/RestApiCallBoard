const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const UnauthorizedError = require('../error/unauthorizedError');
const ForbiddenError = require('../error/forbiddenError');

const salt = bcrypt.genSaltSync(10);
const JWT_SECRET = 'secret key';
module.exports = {
  salt,
  JWT_SECRET,
  checkAuth: (req, res, next) => {
    const header = req.headers.authorization;

    if (typeof header !== 'undefined') {
      jwt.verify(header, JWT_SECRET, (err, decodedToken) => {
        if (err) {
          throw new UnauthorizedError();
        } else {
          req.user = decodedToken;
          next();
        }
      });
    } else {
      throw new ForbiddenError();
    }
  },
};
