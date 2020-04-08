module.exports = (schema, property) => {
  return async (req, res, next) => {
    if (req.method === 'OPTIONS') {
      next();
    }

    try {
      const err = await schema.validate(req[property]);
      if (err.error) {
        return res.status(400).json({message: err.error.details[0].message});
      }
      next();
    } catch (error) {
      return res.status(400).json({message: error.message});
    };
  };
};
