const {User} = require('../models/user');
var authenticate = (req, res, next)=> {
    let token = req.header('x-auth');
    User.findByToken(token).then((user)=> {
        if (!user) {
//            res.status(401).  send({'message': 'couldnt find user'});
            return Promise.reject('couldnt find user');
        }
        req.user = user;
        req.token = token;
        next();
    }).catch((err)=> {
        res.status(401).send({'message':err});
    });    
}

module.exports = {authenticate};