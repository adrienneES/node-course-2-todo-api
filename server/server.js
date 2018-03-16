const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const {mongoose} = require('./db/mongoose');
const {Todo} = require('./models/todo');
const {User} = require('./models/user');

let app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
    let todo = new Todo({
        text: req.body.text        
    });
    todo.save().then((todo) => {
        res.send({todo});
    }, (e) => {
        res.status(400).send(e);
    })
})

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
            .send({todo});
    }).catch((e)=>{
        res.status(400).send()
    })
})

app.get('/todos', (req, res) => {
    Todo.find().then((todos)=> {
        todos.envs = process.env;
        res.send({todos});
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
        res.send({todo});
    }, (e) => {res.status(400).send('problem seen');})
})

app.listen(port, () => {
    console.log(`started on port ${port}`);
});

module.exports = {app};