const Joi = require('@hapi/joi');

module.exports = {
  register: Joi.object({
    username: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(6).max(30).regex(/[a-zA-Z0-9]{6,30}/).required(),
    role: Joi.string().valid('shipper', 'driver').required(),
  }),
  login: Joi.object({
    username: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(6).max(30).regex(/[a-zA-Z0-9]{6,30}/).required(),
  }),
};
