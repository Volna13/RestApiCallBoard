const ApplicationError = require('./applicationError');

module.exports = class NotFoundError extends ApplicationError {
  constructor(message) {
    super(message);
    this.status = 404;
  }
};
