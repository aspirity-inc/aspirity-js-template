'use strict';

// region Module dependencies.
const express = require('express');
const VError = require('verror');
const passport = require('passport');
const Promise = require('bluebird');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const logger = require('../logger');
const validate = require('../middlewares/validateSchema');
const authValid = require('../validators/authSchemas');

const User = mongoose.model('User');

// endregion

const router = express.Router();

function signIn(req, res, next) {
  return Promise.resolve()
    .then(() => {
      logger.info('Auth by login "%s:...', req.body.login);
      return passport.authenticate('loginUsers', (err, user, info) => {
        if (err) { return next(new VError(err, 'authenticate failed')); }
        if (!user) { return res.status(401).json({message: info.message}); }
        return req.logIn(user, (err) => {
          if (err) { return next(new VError(err, 'req.logIn failed')); }
          logger.info('Account "%s" auth successfully.', req.body.login);
          return res.json(user);
        });
      })(req, res, next);
    })
    .catch((err) => { return next(err instanceof Error ? err : new VError(err)); });
}

function signOut(req, res, next) {
  return Promise.resolve()
    .then(() => {
      if (req.user) {
        logger.info('Account "%s" logout.', req.user.login);
        req.logout();
      }
      return res.status(204).end();
    })
    .catch((err) => { return next(err instanceof Error ? err : new VError(err)); });
}

function signUp(req, res, next) {
  const userBody = req.body;
  const conditions = {
    $or: [
      {login: userBody.login},
      {email: userBody.email}
    ],
    removeDate: {$exists: false}
  };
  return User.findOne(conditions)
    .then((existingUser) => {
      if (existingUser) {
        let message = '';
        if (existingUser.login === userBody.login) {message = 'Пользователь с таким логином уже существует.';}
        if (existingUser.email === userBody.email) {message = 'Пользователь с таким email уже существует.';}
        return res.responses.requestError(message, {statusCode: 422});
      }
      const userDoc = {
        title: userBody.title,
        login: userBody.login,
        email: userBody.email
      };
      userDoc.role = 'user';
      bcrypt.hash = Promise.promisify(bcrypt.hash);
      return bcrypt.hash(userBody.password, 10)
        .then((password) => {
          userDoc.password = password;
          return User.create(userDoc);
        })
        .then((user) => {return res.json(user);});
    })
    .catch((err) => { return next(err instanceof Error ? err : new VError(err)); });
}

router.post('/signin', signIn);
router.get('/signout', signOut);
router.post('/signup', validate(authValid.signUp), signUp);

module.exports = router;
