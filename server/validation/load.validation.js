const Joi = require('@hapi/joi');

module.exports = {
  create: Joi.object({
    dimensions: {
      width: Joi.number()
          .min(1)
          .max(200)
          .required(),
      height: Joi.number()
          .min(1)
          .max(350)
          .required(),
      length: Joi.number()
          .min(1)
          .max(700)
          .required(),
    },
    payload: Joi.number()
        .min(1)
        .max(4500)
        .required(),
  }),
  change: Joi.object({
    dimensions: {
      width: Joi.number()
          .min(1)
          .max(200)
          .required(),
      height: Joi.number()
          .min(1)
          .max(350)
          .required(),
      length: Joi.number()
          .min(1)
          .max(700)
          .required(),
    },
    message: Joi.string().min(10).max(200).allow(''),
    payload: Joi.number()
        .min(1)
        .max(4500)
        .required(),
  }),
};
