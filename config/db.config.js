module.exports = {
  HOST: 'localhost',
  USER: 'apiCB_user',
  PASSWORD: 'apicb_pwd',
  DB: 'restApiCallboard_db',
  dialect: 'mysql',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
