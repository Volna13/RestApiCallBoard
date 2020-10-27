const ApplicationError = require('./applicationError');

module.exports = class Forbidden extends ApplicationError {
  constructor(message) {
    super(message);
    this.status = 403;
  }
};
