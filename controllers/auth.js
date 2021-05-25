const { validationResult, body } = require('express-validator');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')


exports.signUp = (req, res, next) => {
    
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        error.errors = errors.array();
        throw error;
    }

    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;

    bcrypt.hash(password, 12)
    .then(hashedPassword => {
        const user = new User({
            email: email,
            password: hashedPassword,
            name: name,
        });
        return user.save();
    })
    .then(result => {
        res.status(201).json({message: 'User created', userId: result._id});
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode = 500
        }
        next(err);
    });


};

exports.login = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        error.errors = errors.array();
        throw error;
    }

    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;

    User.findOne({email: email})
    .then(user => {
        if(!user){
            const error = new Error('User not found');
            error.statusCode = 401;
            error.errors = [];
            throw error;
        }
        loadedUser = user;
        return bcrypt.compare(password, user.password);
    })
    .then(isEqual=> {
        if(!isEqual){
            const error = new Error('Wrong password');
            error.statusCode = 401;
            error.errors = [];
            throw error;
        }
        
        const token = jwt.sign(
            {
                email:loadedUser.email,
                userId: loadedUser._id.toString()
            },
            'somesuppersecret',
            { expiresIn: '1hr' }
        );

        res.status(200).json({ token: token, userId:loadedUser._id.toString() });
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode = 500
        }
        next(err);
    });

};