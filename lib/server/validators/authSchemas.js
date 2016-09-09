'use strict';

const trimStrings = require('./helpers/sanitizer').trimStrings;

function signUp(req) {
  req.body = trimStrings(req.body);
  return {
    login: {
      notEmpty: {errorMessage: 'Поле должно быть заполнено'},
      isLength: {
        options: [4, 20],
        errorMessage: 'Допустимая длина логина 4-20 символов'
      }
    },
    email: {
      notEmpty: {errorMessage: 'Поле должно быть заполнено'},
      isEmail: {errorMessage: 'Неверный формат email'}
    },
    password: {
      isLength: {
        options: [6, 20],
        errorMessage: 'Допустимая длина пароля 6-20 символов'
      },
      notEmpty: {errorMessage: 'Поле должно быть заполнено'}
    },
    title: {
      optional: {options: [{checkFalsy: true}]},
      isLength: {
        options: [1, 25],
        errorMessage: 'Допустимая длина 1-25 символов.'
      }
    }
  };
}

exports.signUp = signUp;
