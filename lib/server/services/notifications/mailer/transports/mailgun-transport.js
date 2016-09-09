// https://github.com/orliesaurus/nodemailer-mailgun-transport

'use strict';

const Mailgun = require('mailgun-js');
const Readable = require('stream').Readable;

module.exports = function (options) {
  return new MailgunTransport(options);
};

function MailgunTransport(options) {
  this.options = options || {};
  this.name = 'Mailgun';
  this.version = '1.0.1';

  this.mailgun = Mailgun({
    apiKey: this.options.auth.api_key,
    domain: this.options.auth.domain || ''
  });
}


MailgunTransport.prototype.send = function send(mail, callback) {
  const mailData = mail.data;
  // convert nodemailer attachments to mailgun-js attachements
  if (mailData.attachments) {
    let a, b, aa = [];
    for (let i in mailData.attachments) {
      a = mailData.attachments[i];
      let data;
      const path = a.path;
      const content = a.content;
      if (typeof content === 'string' || Buffer.isBuffer(content) || content instanceof Readable) {
        data = content;
      } else {
        data = path || undefined;
      }
      b = new this.mailgun.Attachment({
        data: data,
        filename: a.filename || undefined,
        contentType: a.contentType || undefined,
        knownLength: a.knownLength || undefined
      });

      aa.push(b);
    }
    mailData.attachment = aa;
  }

  const options = {
    to: mailData.to,
    from: mailData.from,
    subject: mailData.subject,
    text: mailData.text,
    html: mailData.html,
    attachment: mailData.attachment
  };

  if (mailData.bcc) { options.bcc = mailData.bcc; }

  this.mailgun.messages().send(options, callback);
};

