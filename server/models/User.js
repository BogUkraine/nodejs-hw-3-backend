const {Schema, model} = require('mongoose');

const schema = new Schema({
  username: {type: String, required: true, unique: true},
  password: {type: String, required: true},
  role: {type: String, required: true},
  photo: {},
});

module.exports = model('User', schema);
