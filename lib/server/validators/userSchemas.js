'use strict';

const trimStrings = require('./helpers/sanitizer').trimStrings;

function update(req) {
  req.body = trimStrings(req.body);
  return {
    role: {
      optional: true,
      isContains: {
        options: [['admin', 'user']],
        errorMessage: 'Допустимые значения: admin, user.'
      }
    },
    title: {
      optional: true,
      isLength: {
        options: [1, 25],
        errorMessage: 'Допустимая длина 1-25 символов.'
      }
    },
    email: {
      optional: true,
      isEmail: {errorMessage: 'Неверный формат email'}
    },
    password: {
      optional: true,
      isLength: {
        options: [6, 20],
        errorMessage: 'Допустимая длина пароля 6-20 символов'
      }
    }
  };
}

function reset() {
  return {
    login: {
      isLength: {
        options: [4, 20],
        errorMessage: 'Допустимая длина пароля 4-20 символов'
      },
      notEmpty: {errorMessage: 'Поле должно быть заполнено'}
    }
  };
}

function updatePassword(req) {
  req.body = trimStrings(req.body);
  const userId = req.params.id;
  return {
    newPassword: {
      isLength: {
        options: [6, 20],
        errorMessage: 'Допустимая длина пароля 6-20 символов'
      },
      notEmpty: {errorMessage: 'Поле должно быть заполнено'}
    },
    oldPassword: {
      isLength: {
        options: [6, 20],
        errorMessage: 'Допустимая длина пароля 6-20 символов'
      },
      isSamePassword: {
        options: [userId],
        errorMessage: 'Неверный пароль.'
      },
      notEmpty: {errorMessage: 'Поле должно быть заполнено'}
    }
  };
}

exports.update = update;
exports.reset = reset;
exports.updatePassword = updatePassword;
