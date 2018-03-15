const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const port = process.env.CONNECTION_STRING || 'mongodb://localhost:27017/TodoApp';

//const connectionString = 'mongodb://adriskrtic:adriskrtic@ds215019.mlab.com:15019/todo1';
//connectionString = 'mongodb://localhost:27017/TodoApp'
mongoose.connect(connectionString);


module.exports = {
    mongoose
}