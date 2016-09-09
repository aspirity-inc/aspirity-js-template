'use strict';

const crypto = require('crypto');
const Promise = require('bluebird');
const VError = require('verror');
const biguint = require('biguint-format');
const logger = require('../logger');

const randomBytesAsync = Promise.promisify(crypto.randomBytes, crypto);

function randomBytes(n) {
  return randomBytesAsync(n)
    .then((buf) => {
      return buf.toString('hex');
    })
    .catch((err) => {
      logger.error(err instanceof Error ? err : new VError(err));
      return Promise.reject(err);
    });
}

function randomNumbers(n) {
  return randomBytesAsync(n)
    .then((buf) => {
      const number = biguint(buf, 'dec');
      return Number(number.toString().slice(0, 4));
    })
    .catch((err) => {
      logger.error(err instanceof Error ? err : new VError(err));
      return Promise.reject(err);
    });
}

exports.randomBytes = randomBytes;
exports.randomNumbers = randomNumbers;
