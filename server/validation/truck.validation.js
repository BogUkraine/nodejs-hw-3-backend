const Joi = require('@hapi/joi');

module.exports = {
  create: Joi.object({
    type: Joi.string()
        .valid('SPRINTER', 'SMALL STRAIGHT', 'LARGE STRAIGHT')
        .required(),
  }),
  change: Joi.object({
    name: Joi.string()
        .min(3)
        .max(30)
        .regex(/[a-zA-Z0-9]{3,30}/)
        .required(),
  }),
};
