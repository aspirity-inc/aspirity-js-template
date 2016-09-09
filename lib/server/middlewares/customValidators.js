'use strict';

// region Module dependencies.
const expressValidator = require('express-validator');
const validator = require('validator');
const _ = require('lodash');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const logger = require('../logger');
const userService = require('../services/userService');

const User = mongoose.model('User');
// endregion

// https://github.com/ctavan/express-validator/issues/125 - how validate arrays

function isHours(string) { return /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/.test(string); }

/**
 * Valid numbers:
 * +79676338855
 *
 * @param phone
 * @returns {boolean}
 */
function isMobile(phone) {
  if (!phone) { return false; }
  return /^\+79\d+$/.test(phone);
}

/**
 * Valid numbers:
 * +79676338855
 * 79676338855
 * 89676338855
 * 9676338855
 *
 * @param phone
 * @returns {boolean}
 */
function isPhone(phone) {
  if (!phone) { return false; }
  return /^\+?\d+$/.test(phone);
}

function isContains(item, targetItems) {
  if (!item) { return false; }
  return _.includes(targetItems, item);
}

function isExist(items, Model) {
  if (!items) { return false; }
  if (!_.isArray(items)) { items = [items]; }
  let ids;
  if (_.isPlainObject(items[0])) {
    ids = _.map(items, '_id');
  } else {
    ids = items;
  }
  return Promise.resolve()
    .then(() => {
      const conditions = {_id: {$in: ids}};
      if (Model.schema.paths.removeDate) { conditions.removeDate = {$exists: false}; }
      const isMongoIds = _.some(ids, (id) => { return validator.isMongoId(id); });
      if (!isMongoIds) { return Promise.reject(); }
      return Model.count(conditions)
        .then((count) => {
          if (items.length !== count) { return Promise.reject(); }
          return Promise.resolve();
        });
    });
}

function isExistArray(items, Model) {
  if (!_.isArray(items)) { return false; }
  if (!items.length) { return true; }
  let ids;
  ids = _.map(items, '_id');
  return Promise.resolve()
    .then(() => {
      const conditions = {_id: {$in: ids}};
      if (Model.schema.paths.removeDate) { conditions.removeDate = {$exists: false}; }
      const isMongoIds = _.some(ids, (id) => { return validator.isMongoId(id); });
      if (!isMongoIds) { return Promise.reject(); }
      return Model.count(conditions)
        .then((count) => {
          if (items.length !== count) { return Promise.reject(); }
          return Promise.resolve();
        });
    });
}

/**
 *
 * @param value - Валидируемое значение
 * @param {Object} options
 * @param {string} options.path - Путь до проверяемого поля. Например: 'location.title'
 * @param options.Model - MongooseModel
 * @param [options._id] - Используется в случае когда правило используется для методов обновления. Правило не будет
 * применяться если Id обновляемого объекта (options._id) равен id найденного объекта
 * @returns {*}
 */
function isUnique(value, options) {
  return Promise.resolve()
    .then(() => {
      const path = options.path;
      const Model = options.Model;
      if (!path || !Model) {
        const errMsg = 'VALIDATOR ERROR: options.path & options.Model must be not empty.';
        logger.error(errMsg);
        throw new Error(errMsg);
      }
      const idUpdatedEntity = options._id;
      const conditions = {};
      conditions[path] = value;
      if (Model.schema.paths.removeDate) { conditions.removeDate = {$exists: false}; }
      return Model.findOne(conditions)
        .then((entity) => {
          if (entity && idUpdatedEntity !== entity._id.toString()) { return Promise.reject(); }
          return Promise.resolve();
        });
    });
}

function isConfirmationCode(code) {
  if (!code) { return false; }
  return /^\d{4}$/.test(code);
}

function isUserExistsByEmail(email) {
  return userService.isExistsEmail(email)
    .then((isExist) => {
      if (isExist) { return Promise.reject(); }
      return Promise.resolve();
    });
}

function isSamePassword(oldPassword, userId) {
  const conditions = {
    _id: userId,
    removeDate: {$exists: false}
  };
  return User.findOne(conditions)
    .then((user) => {
      if (!user) { return Promise.resolve(); }
      return new Promise((resolve, reject) => {
        bcrypt.compare(oldPassword, user.password, (err, res) => {
          if (err) { return reject(); }
          if (!res) { return reject(); }
          return resolve();
        });
      });
    });
}

function isDigits(str) {
  return /^[0-9]+$/.test(str);
}

function validationMiddleware() {
  return expressValidator({
    customValidators: {
      isPhone: isPhone,
      isMobile: isMobile,
      isContains: isContains,
      isExist: isExist,
      isUnique: isUnique,
      isConfirmationCode: isConfirmationCode,
      isHours: isHours,
      isExistArray: isExistArray,
      isUserExistsByEmail: isUserExistsByEmail,
      isSamePassword: isSamePassword,
      isDigits: isDigits
    }
  });
}

module.exports = validationMiddleware;
