'use strict';

module.exports = {
  ROLES: {
    ADMIN: ['admin'],
    USER: ['user'],
    ALL: ['admin', 'user']
  },
  NOTIFICATION_TYPE: {
    CHANGE_PASSWORD: {name: 'changePassword'},
    RESET_PASSWORD: {name: 'resetPassword'}
  }
};
