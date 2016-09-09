'use strict';

const path = require('path');
const convict = require('convict');

const conf = convict({
  env: {
    doc: 'The application environment.',
    format: ['dev-local', 'qa', 'dev', 'staging'],
    'default': 'dev-local',
    env: 'NODE_ENV',
    arg: 'node-env'
  },
  db: {
    uri: {
      doc: 'Mongodb connection string',
      format: String, 'default': 'mongodb://127.0.0.1/templatedb',
      env: 'MONGO_URI'
    },
    options: {
      doc: 'Mongodb options object',
      format: Object,
      'default': {
        user: 'admin',
        pass: 'qaz123',
        auth: {
          authdb: 'admin'
        }
      }
    },
    dropDatabaseAlways: {format: Boolean, 'default': false},
    debug: {format: Boolean, 'default': false}
  },
  http: {
    session: {doc: 'Session type', format: String, 'default': 'memory'},
    serveStatic: {doc: 'Enable processing static content requests', format: Boolean, 'default': true},
    port: {doc: 'Http listening port', format: 'port', 'default': 80, arg: 'http-port'},
    url: {format: String}
  },
  sessionSecret: {format: String, 'default': '24vq86asdujv21988sx'},
  oneSignal: {
    apiKey: {doc: 'REST API key for OneSignal', format: String, 'default': 'YzRmOWQyM2YtMTQ0MC00ZTI1LWIzZjAtMDA4MzgwZTgzY2I4'},
    appKey: {doc: 'Our OneSignal Application key', format: String, 'default': 'b31ecfd1-a04d-46fb-b294-89a904621e61'}
  },
  rabbit: {
    url: {
      format: String,
      'default': 'amqp://localhost',
      env: 'RABBIT_URI'
    },
    queueTaskName: {format: String, 'default': 'tasks'},
    prefetchCount: {format: Number, 'default': 1},
    tasksCount: {format: Number, 'default': 5}
  },
  mailgun: {
    auth: {
      api_key: {
        doc: 'Mailgun api-key',
        format: String,
        'default': 'insert your key'
      },
      domain: {
        doc: 'Domain name',
        format: String,
        'default': 'sandboxc5908e87104143cead7fa33785666123.mailgun.org'
      }
    }
  },
  smsc: {
    login: {format: String, 'default': 'insert your login'},
    password: {format: String, 'default': 'insert your password in md5'}
  },
  mail: {
    from: {
      doc: 'Default mail sender',
      format: String,
      'default': 'put in your'
    },
    emailSupport: {
      doc: 'Default email signature',
      format: String,
      'default': 'put in your'
    },
    notificationSubject: {
      doc: 'Default email notification subject',
      format: String,
      'default': 'put in your'
    }
  },
  phone: {
    passwordLength: {format: Number, 'default': 3}
  },
  appMode: {
    doc: 'Application run mode.',
    format: ['server', 'queue', 'all', 'emailProcessor', 'smsProcessor'],
    'default': 'server',
    env: 'APP_MODE',
    arg: 'app-mode'
  },
  version: {doc: 'Application version', format: String, 'default': '0.1.0.0'}
});

const filePath = path.resolve(__dirname, 'env', `${conf.get('env')}.json`);
conf.loadFile(filePath);
conf.validate();

module.exports = conf;
