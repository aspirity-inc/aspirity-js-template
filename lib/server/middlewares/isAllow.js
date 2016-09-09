'use strict';

const _ = require('lodash');

/**
 *
 * @param permissions Array of roles.
 * @returns {Function}
 */
module.exports = (permissions) => {
  if (!permissions) { throw new Error('Permissions must contains user roles.'); }
  return (req, res, next) => {
    if (!req.user) { return res.responses.unauthorized(); }
    const userRole = req.user.role;
    const isAllow = _.includes(permissions, userRole);
    if (isAllow) { return next(); }
    return res.responses.accessDenied('Access denied.');
  };
};
