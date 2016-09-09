'use strict';

// region Module dependencies.
const mongoose = require('mongoose');
const Promise = require('bluebird');
const VError = require('verror');

const errorService = require('./errorService');

const Notification = mongoose.model('Notification');
// endregion

const CONTEXT_GENERATION_FUNCTIONS = {
  resetPassword: passwordNotification,
  changePassword: userNotification
};

function generateNotification(type, data) {
  const func = CONTEXT_GENERATION_FUNCTIONS[type.name];
  if (func !== undefined) {return func(type, data);}
  const error = new VError('Attempt to call a nonexistent function generating notifications');
  errorService.errorOutput(error);
  return Promise.reject(error);
}

function createNotification(recipients, notificationBody) {
  return Promise.map(recipients, (recipient) => {
    notificationBody.recipient = recipient;
    return Notification.create(notificationBody);
  })
    .catch((err) => {
      err = err instanceof Error ? err : new VError(err);
      errorService.errorOutput(err, 'Unexpected Error in CreateNotification');
    });
}

function userNotification(type, user) {
  const recipients = [user];
  const notificationBody = {
    type: type,
    channel: {
      email: {required: true}
    }
  };
  return createNotification(recipients, notificationBody);
}

function passwordNotification(type, data) {
  const recipients = [data.user];
  const notificationBody = {
    type: type,
    data: {
      password: data.password
    },
    channel: {
      sms: {required: true}
    }
  };
  return createNotification(recipients, notificationBody);
}

exports.generateNotification = generateNotification;
