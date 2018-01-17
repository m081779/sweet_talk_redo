const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const socketSchema = new Schema({
  username: {
    type: String,
    unique: true,
    required: [true, 'Username is required']
  },
  socketId: {
    type: String,
    required: [true, 'Socket ID is required']
  }
});

const SocketConnection = module.exports = mongoose.model('SocketConnection', socketSchema);
