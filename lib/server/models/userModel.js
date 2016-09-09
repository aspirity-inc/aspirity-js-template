'use strict';

const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  login: {type: String, required: true},
  password: String,
  title: {type: String},
  email: {
    type: String,
    lowercase: true,
    required: true
  },
  role: {
    type: String,
    required: true,
    'default': 'user',
    'enum': ['admin', 'user']
  },
  createDate: {type: Date, 'default': Date.now, required: true},
  modifyDate: {type: Date, 'default': Date.now, required: true},
  removeDate: Date
}, {
  strict: true,
  versionKey: false,
  collection: 'users'
});

exports.User = mongoose.model('User', accountSchema);
