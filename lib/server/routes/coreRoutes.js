'use strict';

module.exports = (app) => {
  app.use('/api/auth', require('../controllers/authController'));
  app.use('/api/users', require('../controllers/userController'));
  app.use('/api/version', require('../controllers/versionController'));
};
