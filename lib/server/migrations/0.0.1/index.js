'use strict';

// region Module dependencies.
const path = require('path');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const fsp = require('fs-promise');
const mongoose = require('mongoose');
const Promise = require('bluebird');

const User = mongoose.model('User');
// endregion

function createUsers() {
  const usersFilePath = path.resolve(__dirname, 'json', 'users.json');
  return fsp.readFile(usersFilePath)
    .then((text) => {
      let users = JSON.parse(text);
      return Promise.each(users, (user) => {
        const userDoc = {
          login: user.login,
          email: user.email,
          role: user.role,
          title: user.title
        };
        bcrypt.genSalt = Promise.promisify(bcrypt.genSalt);
        bcrypt.hash = Promise.promisify(bcrypt.hash);
        return bcrypt.genSalt()
          .then((salt) => {return bcrypt.hash(user.password, salt);})
          .then((hash) => {return User.create(_.assign(userDoc, {password: hash}));});
      });
    });
}

function getInfo() {
  return Promise.resolve({
    version: '0.0.1',
    requiredVersion: '0.0.0'
  });
}

function migrate() {
  return Promise.resolve()
    .then(createUsers);
}

exports.getInfo = getInfo;
exports.migrate = migrate;
