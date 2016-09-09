'use strict';

// region Module dependencies.
const amqp = require('amqplib');
const VError = require('verror');
const _ = require('lodash');
const glob = require('glob');
const path = require('path');

const config = require('../server/config');
const logger = require('../server/logger');
// endregion

let connection;
let channel;

function connect() {
  return amqp.connect(config.get('rabbit.url'))
    .then((conn) => {
      connection = conn;
      logger.debug('Connect to RabbitMQ...');
      return conn.createConfirmChannel()
        .then((ch) => {
          channel = ch;
          channel.assertQueue(config.get('rabbit.queueTaskName'), {durable: true});
          logger.debug('Create channel...');
          return channel;
        });
    })
    .catch((err) => { return Promise.reject(new VError(err)); });
}

function close() {
  logger.info('Closing rabbit connection...');
  return connection.close()
    .then(() => { return logger.info('Connection closed'); })
    .catch((err) => { return Promise.reject(new VError(err)); });
}

function taskWorker() {
  const tasks = [];
  const queueName = config.get('rabbit.queueTaskName');
  const prefetchCount = config.get('rabbit.prefetchCount');
  glob.sync('lib/server/tasks/**/*.js').forEach((file) => {
    const requiredFile = require(path.resolve(file));
    _.forOwn(requiredFile, (task) => {
      tasks.push(task);
    });
  });

  let connectPromise = Promise.resolve(channel);
  // If channel not created, create new chanel
  if (!channel) { connectPromise = connect(); }
  return connectPromise
    .then((ch) => {
      ch.prefetch(prefetchCount);

      function consume(msg) {
        let taskMsg = JSON.parse(msg.content);
        const taskName = taskMsg.name;
        const taskContext = taskMsg.context;
        const matchedTasks = _.filter(tasks, {name: taskName});

        function mapper(task) {
          return task.handler(taskContext);
        }

        return Promise.map(matchedTasks, mapper, {concurrency: config.get('rabbit.tasksCount')})
          .then(() => { ch.ack(msg); })
          .catch((err) => {
            err = err instanceof Error ? err : new VError(err);
            logger.error(err.stack, 'Error during executing tasks');
          });
      }

      return ch.consume(queueName, consume, {noAck: false})
        .catch((err) => { return Promise.reject(new VError(err)); });
    });
}

function sendTask(name, context) {
  if (!name) { throw new VError('name must be not empty'); }
  const queueTaskName = config.get('rabbit.queueTaskName');
  let connectPromise = Promise.resolve(channel);
  // If channel not created, create new chanel
  if (!channel) { connectPromise = connect(); }
  return connectPromise
    .then((ch) => {
      // TODO: sendToQueue возвращает промис???
      return new Promise((resolve, reject) => {
        ch.sendToQueue(queueTaskName, new Buffer(JSON.stringify({name, context})), {persistent: true}, (err) => {
          if (err) { return reject(new VError(err)); }
          return resolve();
        });
      });
    })
    .catch((err) => { logger.error(err instanceof Error ? err : new VError(err), 'Error during task sending'); });
}

module.exports = {
  close: close,
  sendTask: sendTask,
  taskWorker: taskWorker
};
