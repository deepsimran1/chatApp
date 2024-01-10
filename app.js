var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
// var logger = require('morgan');


const connectDB = require('./config/dbConfig');

var usersRouter = require('./routes/users');
const viewsRouter = require('./routes/views')

var app = express();
const port = 4001;

connectDB();
// app.use(logger('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', "ejs");
app.use('/uploads', express.static('uploads'));

// app.set('views', './views');

app.use('/',viewsRouter);
app.use('/users', usersRouter);



app.listen(port,()=>{
  console.log(`Server is running on port ${port}`);
})

module.exports = app;