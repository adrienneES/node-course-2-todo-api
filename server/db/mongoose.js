const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const connectionString = process.env.CONNECTION_STRING || 'mongodb://localhost:27017/TodoApp'
mongoose.connect(connectionString);


module.exports = {
    mongoose
}