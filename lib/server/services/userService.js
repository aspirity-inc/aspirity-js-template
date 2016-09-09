'use strict'

// region Module dependencies.
const _ = require('lodash');
const bcrypt = require('bcryptjs');

const logger = require('../logger');
const constants = require('../constants');
// endregion

function isAllowed() {
  return (req, res, next) => {
    const user = req.user;
    const id = req.params.id;
    if (!user) { return res.responses.unauthorized(); }
    if (id === user.id || _.includes(constants.ROLES.ADMIN, user.role)) {return next();}
    return res.responses.accessDenied('Access denied.');
  }
}

function isEditPasswordAllowed() {
  return (req, res, next) => {
    const user = req.user;
    const id = req.params.id;
    if (!user) { return res.responses.unauthorized(); }
    if (id !== user.id) {return res.responses.accessDenied('Access denied.');}
    return next();
  };
}

function changePassword(user, password) {
  bcrypt.hash = Promise.promisify(bcrypt.hash);
  return bcrypt.hash(password, 10)
    .then((password) => {
      user.password = password;
      user.modifyDate = new Date();
      return user.save();
    });
}

exports.isAllowed = isAllowed;
exports.changePassword = changePassword;
exports.isEditPasswordAllowed = isEditPasswordAllowed;
