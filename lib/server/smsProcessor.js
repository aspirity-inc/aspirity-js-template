'use strict';

// region Module dependencies.
const VError = require('verror');
const Promise = require('bluebird');
const mongoose = require('mongoose');

const mailerService = require('./services/notifications/mailer/mailerService');
const errorService = require('./services/errorService');

const Notification = mongoose.model('Notification');
// endregion

const LOOP_DELAY = 1 * 1000; // 1 seconds
let isProcessed = false;

function getUnsentSMS() {
  if (isProcessed) { return null; }
  isProcessed = true;
  const conditions = {
    'channel.sms.required': true,
    'channel.sms.isSent': false,
    removeDate: {$exists: false}
  };
  return Notification.find(conditions)
    .then((notifications) => {
      return Promise.map(notifications, (notification) => {
        //return mailerService.generationSmsNotification(notification);
      });
    })
    .then(() => { })
    .catch((err) => {
      err = err instanceof Error ? err : new VError(err);
      errorService.errorOutput(err, 'Unexpected Error in getUnsentSMS');
    })
    .finally(() => { isProcessed = false; });
}

let intervalId = null;
function start() { intervalId = setInterval(getUnsentSMS, LOOP_DELAY); }

function stop() { clearInterval(intervalId); }

exports.start = start;
exports.stop = stop;
