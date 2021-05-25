// const { Console } = require('console');
const { validationResult, body } = require('express-validator');
const fs = require('fs')
const path = require('path')
const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    let totalItems;

    Post.find()
    .countDocuments()
   .then(count => {
       totalItems = count;
       return  Post.find()
       .then(posts => {
           res.status(200).json({message: 'Fetched posts successfully', posts: posts}); 
       })
       .catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    });
   })
    .catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    });
};

exports.createPost = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        error.errors = errors.array();
        throw error;
    }

    if(!req.file){
        const error = new Error('No image provided');
        error.statusCode = 422;
        throw error;
    }

    const imageUrl = req.file.path; 

    const title = req.body.title;
    const content = req.body.content;
    let creator;

    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: req.userId
    })
    post.save()
    .then(result => {
        return User.findById(req.userId)
    })
    .then(user => {
        creator = user;
        user.posts.push(post);
        return user.save();
    })
    .then(result => {
        res.status(201).json({
            meessage : 'Post created successfully',
            post: post,
            creator: { _id: creator._id, name: creator.name }
        });
    })
    .catch(err => {
        if(!err.statusCode){
            err.statusCode = 500
        }
        next(err);
    });

   
};


exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    post.findById(postId)
    .then(post => {
        if(!post){
            const error = new Error('Post not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({message:  'Post fetched', post: post});

    })
    .catch( err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
};

exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        error.errors = errors.array();
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image

    if(req.file){
        imageUrl = req.file.path
    }

    if(!imageUrl){
        const error = new Error('No image selected');
        error.statusCode = 422;
        error.errors = [];
        throw error;
    }

    Post.findById(postId)
    .then(post => {
        if(!post){
            const error = new Error('Post not found');
            error.statusCode = 422;
            error.errors = [];
            throw error;
        }

        if(post.creator.toString() !== req.userId){
            const error = new Error('Not authorized');
            error.statusCode = 403;
            error.errors = [];
            throw error;
        }
        
        if(imageUrl !== post.imageUrl){
            clearImage(post.imageUrl);
        }
        post.title = title;
        post.content = content;
        post.imageUrl = imageUrl;
        return post.save()
    })
    .then( result => {
        res.status(200).json({message: 'Post update', post: result});
    })
    .catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })

};

exports.deletePost = (req, res, next) => {
   const postId = req.params.postId;
   Post.findById(postId)
   .then(post => {
    if(!post){
        const error = new Error('Post not found');
        error.statusCode = 404;
        error.errors = [];
        throw error;
    }

    if(post.creator.toString() !== req.userId){
        const error = new Error('Not authorized');
        error.statusCode = 403;
        error.errors = [];
        throw error;
    }
    
    clearImage(post.imageUrl)
    return Post.findByIdAndRemove(postId);

   })
   .then(result => {
        return User.findById(req.userId);
    })
   .then(user => {
        user.posts.pull(postId);
        return user.save();
   })
   .then(result => {
    res.status(200).json({message: 'Post removed'});
   })
   .catch(err => {
       if(!err.statusCode){
           err.statusCode = 500;
       }
       next(err);
   })

};

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
} 