var createError = require('http-errors');
var express = require('express');

var app = express();
var path = require('path');
const cors = require('cors');

var cookieParser = require('cookie-parser');
const { logger } = require('./middleware/logEvents');
var corsOptions = require('./config/corsOptions');

const errorHandler = require('./middleware/errorHandler');
const credentials = require('./middleware/credentials');

const PORT = process.env.PORT || 3500;


// custom middleware logger
app.use(logger);

// handle options credentials check - before CORS!
// and fetch cookies credentials requirement
app.use(credentials)

// Cross Origin Resource Sharing
app.use(cors(corsOptions))

// built-in middleware for json
app.use(express.json());

// built-in middleware to handle urlencoded form data
app.use(express.urlencoded({ extended: false }));

//middleware for cookies
app.use(cookieParser());
app.use('/', express.static(path.join(__dirname, 'public')));

// routes
app.use('/', require('./routes/index') );
app.use('/signin', require('./routes/signin') );
app.use('/logout', require('./routes/logout') );
app.use('/signup', require('./routes/signup') );
app.use('/refresh-token', require('./routes/refresh') );
app.use('/employees', require('./routes/api/employees') );
app.use('/customers', require('./routes/api/customers') );

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  // res.render('error');
});

app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
