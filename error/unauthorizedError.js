const ApplicationError = require('./applicationError');

module.exports = class UnauthorizedError extends ApplicationError {
  constructor(message) {
    super(message);
    this.status = 401;
  }
};
