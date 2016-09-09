'use strict';

// region Module dependencies.
const EmailTemplate = require('email-templates').EmailTemplate;
const nodemailer = require('nodemailer');
const path = require('path');
const VError = require('verror');
const Promise = require('bluebird');
const _ = require('lodash');
const NodeSms = require('./transports/node-smsc/index').Smsc;

const mailgunTransport = require('./transports/mailgun-transport');
const config = require('../../../config');
const errorService = require('../../errorService');
// endregion

const TEMPLATE_DIR = 'lib/server/services/notifications/templates/';
// region Email constants.
const MAIL_FROM = config.get('mail.from');
const SUGNATURE = config.get('mail.emailSupport');
const SUBJECT = config.get('mail.notificationSubject');
let _mailer;
// endregion

// region Sms constants.
const LOGIN = config.get('smsc.login');
const PASSWORD = config.get('smsc.password');
const smsSender = new NodeSms(LOGIN, PASSWORD);
// endregion

// region Email notifications.
function getMailer() {
  if (!_mailer) {
    const auth = config.get('mailgun');
    _mailer = nodemailer.createTransport(mailgunTransport(auth));
    _mailer.sendMail = Promise.promisify(_mailer.sendMail);
  }
  return _mailer;
}

function generationEmailNotification(notification) {
  notification.channel.email.isSent = true;
  return notification.save()
    .then(() => {
      if (!notification.recipient.email) {return null;}
      const context = {
        name: notification.recipient.title,
        emailSupport: SUGNATURE
      };
      _.assign(context, notification.data);
      const mailOptions = {
        to: notification.recipient.email,
        subject: notification.data.subject || SUBJECT
      };
      return renderAndSendEmail(notification.type.name, context, mailOptions);
    });
}

/**
 *
 * @param templateName - Name of dir, where located template
 * @param {Object} renderEntity
 * @param {Object} mailOptions
 * @param mailOptions.to
 * @param mailOptions.subject
 * @returns {Promise|Promise.<T>}
 */
function renderAndSendEmail(templateName, renderEntity, mailOptions) {
  if (!mailOptions.to || !mailOptions.subject) {
    return Promise.reject(new VError('mailOptions.to and mailOptions.subject must be not empty'));
  }
  const templatePath = path.resolve(TEMPLATE_DIR + 'email', templateName);
  const template = new EmailTemplate(templatePath);
  return template.render(renderEntity)
    .then((renders) => {
      const mailer = getMailer();
      mailOptions.from = MAIL_FROM;
      mailOptions.text = renders.text;
      mailOptions.html = renders.html;
      return mailer.sendMail(mailOptions)
        .then((result) => {
          return result;
        });
    })
    .catch((err) => {
      err = err instanceof Error ? err : new VError(err);
      errorService.errorOutput(err, 'Unexpected Error in renderAndSendEmail');
    });
}
// endregion

function generationSmsNotification(notification) {
  notification.channel.sms.isSent = true;
  return notification.save()
    .then(() => {
      if (!notification.recipient.phone) {return null;}
      const templatePath = path.resolve(TEMPLATE_DIR + 'sms', notification.type.name);
      const template = new EmailTemplate(templatePath);
      return template.render(notification.data)
        .then((renders) => {
          const context = {
            phone: notification.recipient.phone,
            text: renders.text
          };

          smsSender.list = Promise.promisify(smsSender.list);
          return smsSender.list(context)
            .then(() => {});
        });
    })
    .catch((err) => {
      err = err instanceof Error ? err : new VError(err);
      errorService.errorOutput(err, 'Unexpected Error in generationSmsNotification');
    });
}

exports.generationSmsNotification = generationSmsNotification;
exports.generationEmailNotification = generationEmailNotification;
