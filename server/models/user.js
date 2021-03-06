const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        minlength:1,
        unique: true, 
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not a vald email'
        }
    },
    password: {
        type: String,
        required: true,
        minlength:6
    },
    // token only available on mongodb
    tokens:  [ {
        access: {
            type: String,
            required:true
        },
        token: {
            type: String,
            required:true
        }
    } ]
});
UserSchema.methods.generateAuthToken = function () {
    let user = this;
    let access = 'auth';
    let token = jwt.sign({
        _id: user._id.toHexString(), 
        access}, process.env.JWT_SECRET).toString();
//    user.tokens.push({acScess, token});
    user.tokens = user.tokens.concat([{access, token}]);
    return user.save().then(()=> {
        return token;
    })
}

UserSchema.statics.findByToken = function(token) {
    let User = this; 
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        return User.findOne({
            '_id': decoded._id,
            'tokens.token':token,
            'tokens.access' : 'auth'
        })
    } catch (e) {
        return Promise.reject('there was an error');
        // return new Promise((resolve, reject) => {
        //     reject();
        // })        
    }
}
UserSchema.statics.findByCredentials = function(email, password) {
    const user = this;
    return User.findOne({email}).then((user)=> {
        if (!user) {
            return Promise.reject('couldnt find user');
        }

        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, result) => {
                if (result) {
                    resolve(user);
                } else {
                    reject('password didnt match');
                }
            })
        })
    })
}
UserSchema.pre('save', function(next) {
    const user = this;
    if (user.isModified('password')) {
        bcrypt.genSalt(10,(err, salt)=>{
            bcrypt.hash(user.password, salt, (err, hash)=>{
                user.password = hash;
                next();
            });
        });
    } else {
        next();
    }
})
UserSchema.methods.toJSON = function () {
    let user = this;
    let userObject = user.toObject();
    return _.pick (userObject, ['_id', 'email']);
}
UserSchema.methods.removeToken = function(token) {
    let user = this;
    return user.update({
        $pull: {
            tokens: {
                token
            }
        }
    })
}
const User = mongoose.model('User', UserSchema
 )
module.exports = {User};