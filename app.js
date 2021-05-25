const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const app = express();

// upload image

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "images");
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  });
  
  const fileFilter = (req, file, cb) => {
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };
  
// upload image ends here then register multa below
app.use(bodyParser.json()); //application/json

app.use('/images', express.static(path.join(__dirname, 'images'))); // serve image statically to any request going to /images

app.use(multer({ storage: storage, fileFilter: fileFilter }).single("image"));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});


app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const errors = error.errors;
    res.status(status).json({message: message, errors: errors});
});

mongoose.connect('mongodb://localhost/messages')
.then(result => {
    app.listen(8000);
})
.catch(err => console.log())

