require('./config/config');
const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');

const {ObjectID} = require('mongodb');
const {mongoose} = require('./db/mongoose');
const {Todo} = require('./models/todo');
const {User} = require('./models/user');
const {authenticate} = require('../server/middleware/authenticate');
let app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

app.delete('/todos/:id', (req, res) => {
    const id = req.params.id;
    if (!ObjectID.isValid(id)) {
        return res.status(400).send(`${id} not a valid object id`)
    }
    Todo.findByIdAndRemove(id).then((todo)=> {
        if (!todo) {
            return res.status(404).send(`${id} not found to delete`);
        }
        res.status(200)
            .send({"message": `todo ${id} deleted`, todo});
    }).catch((e)=>{
        res.status(400).send()
    })
})

app.get('/todos', (req, res) => {
    Todo.find().then((todos)=> {
        todos.envs = process.env;
        res.send({"message": `all todos sent`, todos});
    }, (e) => {res.send(400).send(e)});
})

app.get('/todos/:id', (req, res) => {
    const id = req.params.id;
    if (!ObjectID.isValid(id)) {
        return res.status(404).send('bad object id');
    }
    Todo.findById(req.params.id).then((todo)=>{
        if (!todo) {
            return res.status(404).send(`todo${req.params.id} not found`)
        }
        res.send({"message": `todo ${id} sent`, todo});
    }, (e) => {res.status(400).send('problem seen');})
});

app.patch('/todos/:id', (req, res) => {
    const id = req.params.id;

    // _.pick allows cherry picking of properties from object
    //  with array of properties desired.
    var body = _.pick(req.body, ['text', 'completed']);

    if (!ObjectID.isValid(id)) {
        return res.status(400).send(`todo ${id} does not exist`);
    }

    if (_.isBoolean(body.completed) && body.completed) {
        body.completedAt = new Date().getTime();
    } else {
        body.completed = false;
        body.completedAt = null;
    }
    Todo.findByIdAndUpdate(id, {$set:body}, {new:true})
        .then((todo)=> {
            if (!todo) {
                return res.status(404).send();
            }
            res.status(200).send({"message": "todo was patched", todo});
        })
        .catch((err)=>res.status(400).send());
    
});

app.post('/todos', (req, res) => {
    let todo = new Todo({
        text: req.body.text        
    });
    todo.save().then((todo) => {
        res.send({"message": `todo was created`, todo});
    }, (e) => {
        res.status(400).send(e);
    })
})

app.post('/users', (req, res) => {
    const body = _.pick(req.body, ['email', 'password']);
    const user = new User(body);
    user.save().then(()=>{
        return user.generateAuthToken();
        //res.status(200).send({message:'saved', result});
    }).then((token)=>{
        res.header('x-auth',token).send(user);
    })
    .catch((e)=> {
        res.status(400).send({message: 'error happened saving', err: e});
    })
})

app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user);
})

app.listen(port, () => {
    console.log(`started on port ${port}`);
});

module.exports = {app};