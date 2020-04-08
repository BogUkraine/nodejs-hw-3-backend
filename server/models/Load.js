const {Schema, model, Types} = require('mongoose');

const schema = new Schema({
  created_by: {type: Types.ObjectId, required: true, ref: 'User'},
  assigned_to: {type: Types.ObjectId, ref: 'User', default: null},
  logs: [{
    message: {type: String, required: true},
    time: {type: Date, default: Date.now}},
  ],
  status: {type: String, required: true},
  state: {type: String},
  dimensions: {
    width: {type: String, required: true},
    length: {type: String, required: true},
    height: {type: String, required: true},
  },
  payload: {type: Number, required: true},
  message: {type: String},
});

module.exports = model('Load', schema);
