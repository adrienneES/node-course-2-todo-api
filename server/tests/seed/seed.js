const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');
const {Todo} = require('./../../models/todo');
const {User} = require('./../../models/user');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();
// first user will hvae a good authentication token
// second not
const users = [{
    _id: userOneId,
    email: 'adri@skrtic.com',
    password: 'adri4546',
    tokens: [{
        access: 'auth',
        token: jwt.sign({_id:userOneId, access: 'auth'}, 'abc123').toString()
    }]
},{
    _id: userTwoId,
    email: 'paul@skrtic.com',
    password: 'paul4546'
}]

const populateUsers = (done) => {
    User.remove({}).then(()=> {
        let userOne = new User(users[0]).save();
        let userTwo = new User(users[1]).save();
        return Promise.all([userOne, userTwo])
    }).then(()=> done());
};

const todos = [{
    _id: new ObjectID(),
    text: 'First test todo'
  }, {
    _id: new ObjectID(),
    text: 'Second test todo',
    completed: true,
    completedAt:333
  }];
  
const populateTodos = (done) => {
    Todo.remove({}).then(() => {
      return Todo.insertMany(todos);
    }).then(() => done());
};

module.exports = {populateTodos, todos, users, populateUsers};