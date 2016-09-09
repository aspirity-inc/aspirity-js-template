'use strict';

const Promise = require('bluebird');

let server;
let mongodb;
let logger;
let task;
let config;
let emailProcessor;
let smsProcessor;

function start() {
  // Init models
  require('./models');
  // Using bluebird promises instead native promise
  global.Promise = Promise;

  server = require('./server');
  mongodb = require('./mongodb');
  logger = require('./logger');
  task = require('./task');
  config = require('./config');
  emailProcessor = require('./emailProcessor');
  smsProcessor = require('./smsProcessor');

  logger.debug('Starting application...');
  logger.debug(`NODE_ENV: ${config.get('env')}`);
  return mongodb.connect()
    .then((dbConnection) => {
      const appMode = config.get('appMode');
      let serverPromise;
      let taskPromise;
      switch (appMode) {
        case 'server':
          serverPromise = server.start(dbConnection);
          break;
        case 'queue':
          taskPromise = task.taskWorker();
          break;
        case 'emailProcessor':
          emailProcessor.start();
          break;
        case 'smsProcessor':
          smsProcessor.start();
          break;
        default:
          emailProcessor.start();
          smsProcessor.start();
          serverPromise = server.start(dbConnection);
          taskPromise = task.taskWorker();
          break;
      }
      return Promise.all([serverPromise, taskPromise]);
    })
    .then(() => { return logger.info('Application started.'); });
}

// Start application
start()
  .catch((err) => {
    logger.error(err);
    return process.exit(1);
  });

exports.start = start;
