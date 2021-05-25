const express = require('express')
const router = express.Router();
const User = require('../models/user');
const authController = require('../controllers/auth');

const { body, validationResult } = require('express-validator');

router.put('/signup', 
    [
        body('name')
            .trim()
            .isLength({min:5})
            .withMessage('Name is required and min of 5'),
        body('email')
            .trim()
            .isEmail()
            .withMessage('email is required a')
            .custom((value, {req}) => {
               return User.findOne({email: value})
                .then(userDoc => {
                    if(userDoc){
                        return Promise.reject('Email already exist, enter another email');
                    }
                })
            }).normalizeEmail(),
        body('password')
            .not()
            .isEmpty()
            .withMessage('Password is requied'),
    ], authController.signUp
);

router.post('/login', authController.login)

module.exports = router;