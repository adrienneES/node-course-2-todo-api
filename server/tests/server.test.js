const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');
const {populateTodos, todos, users, populateUsers} = require('./seed/seed')

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {
  it('should create a new todo', (done) => {
    var text = 'Test todo text';

    request(app)
      .post('/todos')
      .send({text})
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find({text}).then((todos) => {
          expect(todos.length).toBe(1);
          expect(todos[0].text).toBe(text);
          done();
        }).catch((e) => done(e));
      });
  });

  it('should not create todo with invalid body data', (done) => {
    request(app)
      .post('/todos')
      .send({})
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find().then((todos) => {
          expect(todos.length).toBe(2);
          done();
        }).catch((e) => done(e));
      });
  });
});

describe('GET /todos', () => {
  it('should get all todos', (done) => {
    request(app)
      .get('/todos')
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(2);
      })
      .end(done);
  });
});

describe('GET /todos/:id', () => {
  it('should return todo doc', (done) => {
    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(todos[0].text);
      })
      .end(done);
  });

  it('should return 404 if todo not found', (done) => {
    var hexId = new ObjectID().toHexString();

    request(app)
      .get(`/todos/${hexId}`)
      .expect(404)
      .end(done);
  });

  it('should return 404 for non-object ids', (done) => {
    request(app)
      .get('/todos/123abc')
      .expect(404)
      .end(done);
  });
});

describe('DELETE /todos:id', () => {
    it('should delete a found item', (done) => {
        const id = todos[0]._id.toHexString();
        request(app)
            .delete(`/todos/${id}`)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo._id).toBe(id);
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }
                Todo.findById(id).then((todo)=> {
                    expect(todo).toBe(null);
                    done();
                }).catch((e)=> {done(e)});

            });
  });

    it('should return 404 if todo not found', (done) => {
        const id = new ObjectID().toHexString();
        request(app)
            .delete(`/todos/${id}`)
            .expect(404)
            .end(done);

            
        });

    it('should return 400 if objectID is invalid', (done) => {
        request(app)
            .delete(`/todos/123`)
            .expect(400)
            .end(done);
    });
})

describe('PATCH/todos:id', () => {
  it ('should update a todo', (done) => {
    // get id of first item
    // make patch request with update text & set completed = true
    // assert 200
    // assert response body has changed text & completed is true & completed at is a number
    const id = todos[0]._id.toHexString();
    const updatedText = "updated";
    request(app)
      .patch(`/todos/${id}`)
      .send({
        text: updatedText,
        completed:true
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe('updated');
        expect(res.body.todo.completed).toBe(true);
        expect(res.body.todo.completedAt).toBeA('number');
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        done();
      })
  });
  it('should clear completed at when todo is not completed', (done)=> {
    // get id of 2nd item
    // make patch request with setting text & set complete=false
    // assert 200
    // expect text is changed and completed is false & compeltedat is null
    const id = todos[1]._id.toHexString();
    const text = "second update";

    request(app)
      .patch(`/todos/${id}`)
      .send({text, completed:false})
      .expect(200)
      .expect((res)=>{
        console.log(res.body.todo);
        expect(res.body.todo.text).toBe(text);
        expect(res.body.todo.completed).toBe(false);
        expect(res.body.completedAt).toBe(undefined);
      })
      .end(done);
  });
})

describe('GET /todos/me', () => {
  it('should return user if authenticated', (done) => {
    request(app)
      .get('/users/me')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res)=> {
        expect(res.body._id).toBe(users[0]._id.toHexString());
        expect(res.body.email).toBe(users[0].email);
      })
      .end(done);
  });

  it('should return a 401 if not authenticated', (done) => {
    request(app)
    .get('/users/me')
//    .set('x-auth', users[1].tokens[0].token)
    .expect(401)
    .expect((res) => {
      expect(res.body.message).toBe('there was an error');
    })
    .end(done);
  })
})
describe('POST /users', () => {
  it('should create a user', (done)=> {
    const email = 'callie@skrtic.com';
    const password = 'callie4546';
    request(app)
      .post('/users')
      .send({email, password})
      .expect(200)
      .expect((res)=> {
        expect(res.headers['x-auth']).toExist();
        expect(res.body._id).toExist();
        expect(res.body.email).toBe(email);
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        User.findOne({email}).then((user)=> {
          expect(user).toExist();
          expect(user.password).toNotBe(password);
          done();
        }).catch((e)=>done(e))
      });
  })
  it ('should return validtion errors if request invalid', (done) => {
    const email = 'a';
    const password = '1';
    request(app)
      .post('/users')
      .send({email, password})
      .expect(400)
      .expect((res) => {
        expect(res.body.user).toBe(undefined);
      })
      .end(done);
  })
  it ('should not create user if email in use', (done) => {
    const email = 'paul@skrtic.com';
    const password = 'callie4546';
    request(app)
      .post('/users')
      .send({email, password})
      .expect(400)
      .expect((res)=> {
        expect(res.body.message).toBe('error happened saving');
      })
      .end(done);
  })
});

describe ('POST /users/login', () => {

  it('should login user and return auth token', (done)=> {
    request(app)
    .post('/users/login')
    .send({
      email: users[1].email,
      password: users[1].password
    })
    .expect(200)
    .expect((res)=> {
      expect(res.headers['x-auth']).toExist();
    })
    .end((err, res)=>{
      if(err) {
        return done(err);
      }
      User.findById(users[1]._id).then((user)=>{
        expect(user.tokens[0]).toInclude({
          access:'auth',
          token:res.headers['x-auth']
        });
        done();
      }).catch((e)=>done(e))
    })
  });

  it ('should reject invalid login', (done)=> {
    request(app)
      .post('/users/login')
      .send({email:users[1].email, password:'abc'})
      .expect(400)
      .expect((res)=> {
        User.findById(users[1]._id).then((user)=>{
          expect(user.tokens.length).toBe(0);
          done();
        })
      }).catch((e)=>done(e));

  });
});