'use strict';

// region Module dependencies.
const express = require('express');
const VError = require('verror');
const Promise = require('bluebird');
const mongoose = require('mongoose');
const _ = require('lodash');

const dataOptions = require('../middlewares/dataOptions');
const validate = require('../middlewares/validateSchema');
const randomBytes = require('../services/randomBytes');
const isAllow = require('../middlewares/isAllow');
const userValid = require('../validators/userSchemas');
const filterMiddleware = require('./../middlewares/filtersBuilder');
const notificationService = require('../services/notificationService');
const constants = require('../constants');
const userService = require('../services/userService');
const config = require('../config');

const User = mongoose.model('User');

// endregion

const router = express.Router();

function getById(req, res, next) {
  const id = req.params.id;
  const conditions = {
    _id: id,
    removeDate: {$exists: false}
  };
  User.findOne(conditions, {password: false})
    .then((user) => {
      if (!user) { return res.responses.notFoundResource(); }
      return res.json(user);
    })
    .catch((err) => { return next(err instanceof Error ? err : new VError(err)); });
}

function getAll(req, res, next) {
  const limit = req.dataOptions.limit;
  const baseConditions = {removeDate: {$exists: false}};
  const userSearch = req.query.userSearch;
  let userSearchConditions = {};
  if (!_.isUndefined(userSearch)) {
    userSearchConditions = {
      $or: [
        {title: new RegExp(`.*${userSearch}.*`, 'i')},
        {login: new RegExp(`.*${userSearch}.*`, 'i')},
        {email: new RegExp(`.*${userSearch}.*`, 'i')}
      ]
    };
  }
  const filters = req.filters;
  const conditions = _.assign({}, baseConditions, filters, userSearchConditions);
  const userFind = User.find(conditions, {password: false}, req.dataOptions);
  const userCount = User.count(conditions);
  return Promise.all([userFind, userCount])
    .spread((users, count) => {
      res.set('X-Count-Items', count);
      res.set('X-Count-Pages', Math.ceil(count / limit));
      return res.json(users);
    })
    .catch((err) => { return next(err instanceof Error ? err : new VError(err)); });
}

function update(req, res, next) {
  const userRole = req.user.role;
  const id = req.params.id;
  const userBody = req.body;
  const conditions = {
    _id: id,
    removeDate: {$exists: false}
  };
  return User.findOne(conditions)
    .then((user) => {
      if (!user) { return res.responses.notFoundResource(); }
      let userDoc = {modifyDate: new Date()};
      if (_.isString(userBody.title)) {userDoc.title = userBody.title;}
      if (_.isString(userBody.email)) {userDoc.email = userBody.email;}
      if (_.includes(constants.ROLES.ADMIN, userRole) && userBody.role) {userDoc.role = userBody.role;}
      _.assign(user, userDoc);
      return user.save()
        .then((user) => {return res.json(user);});
    })
    .catch((err) => { return next(err instanceof Error ? err : new VError(err)); });
}

function destroy(req, res, next) {
  const id = req.params.id;
  const baseConditions = {removeDate: {$exists: false}};
  const userConditions = {_id: id};
  return User.findOne(_.assign({}, userConditions, baseConditions))
    .then((user) => {
      if (!user) { return res.responses.notFoundResource(); }
      user.removeDate = Date.now();
      return user.save()
        .then(() => {return res.responses.success();});
    })
    .catch((err) => { return next(err instanceof Error ? err : new VError(err)); });
}

function resetPassword(req, res, next) {
  const login = req.body.login;
  const conditions = {
    login: login,
    removeDate: {$exists: false}
  };
  return User.findOne(conditions)
    .then((user) => {
      if (!user) { return res.responses.notFoundResource(); }
      return randomBytes.randomBytes(config.get('phone.passwordLength'))
        .then((password) => {
          return userService.changePassword(user, password)
            .then((updatedUser) => {
              const data = {
                user: updatedUser,
                password: password
              };
              notificationService.generateNotification(constants.NOTIFICATION_TYPE.RESET_PASSWORD, data);
              notificationService.generateNotification(constants.NOTIFICATION_TYPE.CHANGE_PASSWORD, updatedUser);
              return res.responses.success();
            });
        });
    })
    .catch((err) => { return next(err instanceof Error ? err : new VError(err)); });
}

function updatePassword(req, res, next) {
  const newPassword = req.body.newPassword;
  const userId = req.params.id;
  const conditions = {
    _id: userId,
    removeDate: {$exists: false}
  };
  return User.findOne(conditions)
    .then((user) => {
      if (!user) { return res.responses.notFoundResource(); }
      return userService.changePassword(user, newPassword)
        .then((updatedUser) => {
          notificationService.generateNotification(constants.NOTIFICATION_TYPE.CHANGE_PASSWORD, updatedUser);
          return res.responses.success();
        });
    })
    .catch((err) => { return next(err instanceof Error ? err : new VError(err)); });
}

router.get('/', isAllow(constants.ROLES.ADMIN), dataOptions(), filterMiddleware(User), getAll);
router.get('/:id([0-9A-F]{24})', userService.isAllowed(), getById);
router.put('/:id([0-9A-F]{24})', userService.isAllowed(), validate(userValid.update), update);
router.delete('/:id([0-9A-F]{24})', userService.isAllowed(), destroy);

router.put('/forgot', validate(userValid.reset), resetPassword);
router.put('/:id([0-9A-F]{24})/password', userService.isEditPasswordAllowed(), validate(userValid.updatePassword), updatePassword); // eslint-disable-line max-len

module.exports = router;
