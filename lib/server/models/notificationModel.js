'use strict';

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    _id: {type: mongoose.Schema.Types.ObjectId},
    title: {type: String, required: true},
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    phone: {type: String}
  },
  isRead: {type: Boolean, 'default': false, required: true},
  type: {
    name: {type: String, required: true},
    group: {
      type: String,
      required: false,
      'enum': ['report', 'pre-moderation', 'reservation', 'discussion', 'assign']
    }
  },
  data: {type: mongoose.Schema.Types.Mixed, required: false},
  channel: {
    site: {type: Boolean, 'default': false, required: true},
    email: {
      required: {type: Boolean, 'default': false, required: true},
      isSent: {type: Boolean, 'default': false, required: true}
    },
    sms: {
      required: {type: Boolean, 'default': false, required: true},
      isSent: {type: Boolean, 'default': false, required: true}
    }
  },
  createDate: {type: Date, 'default': Date.now, required: true},
  modifyDate: {type: Date, 'default': Date.now, required: true},
  removeDate: Date
}, {
  strict: true,
  versionKey: false,
  collection: 'notifications'
});

exports.Notification = mongoose.model('Notification', notificationSchema);
