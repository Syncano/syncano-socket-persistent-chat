/* eslint no-throw-literal: 0 */

/**
 * Check value empty, undefined or null
 * @param {*} val
 * @returns {boolean}
 */
const checkRequired = (val) => {
  if (val === undefined || val === null) {
    return false;
  }
  const str = String(val).replace(/\s/g, '');
  return str.length > 0;
};

/**
 * Check for parameters required
 * @param {object} obj
 * @param {string} message
 * @returns {object| null} error response
 */
const validateRequired = (obj, message = 'Validation error(s)') => {
  const validateMessages = {};
  Object.keys(obj).forEach((key) => {
    if (!checkRequired(obj[key])) {
      validateMessages[key] = `The ${key} field is required`;
    }
  });

  if (Object.keys(validateMessages).length > 0) {
    throw ({ message, details: validateMessages });
  }
};

const checkRequestMethodType = (requestMethod, expectedMethodTypes) => {
  const expectedAsString = expectedMethodTypes.join(', ');
  if (!expectedMethodTypes.includes(requestMethod)) {
    throw ({
      message: `Make sure to use ${expectedAsString} for creating, retrieving, updating and deleting chat groups`
    });
  }
};

export {
  checkRequestMethodType,
  validateRequired
};
