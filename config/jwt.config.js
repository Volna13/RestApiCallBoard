const jwt = require('jsonwebtoken');

const JWT_SECRET = 'secret key';
module.exports = {
  JWT_SECRET,
  checkAuth: (req, res, next) => {
    // const header = req.headers['authorization'];
    const header = req.headers.authorization;

    if (typeof header !== 'undefined') {
      const bearer = header.split(' ');
      const token = bearer[1];

      jwt.verify(token, JWT_SECRET, (err, decodedToken) => {
        if (err) {
          // If error send Forbidden (403)
          // console.log(err);
          // console.log('ERROR: Could not connect to the protected route');
          res.status(403).send({
            message: 'Could not connect to the protected route',
          });
        } else {
          // If token is successfully verified, we can send the authorized data
          req.user = decodedToken;
          next();
        }
      });
    } else {
      // If header is undefined return Forbidden (403)
      res.status(403).send({
        message: 'header is undefined',
      });
    }
  },
};
