const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const sassMiddleware = require('node-sass-middleware');
const session = require('express-session');
const passport = require('passport');
const helmet = require('helmet');
const flash = require('connect-flash');
const dotenv = require('dotenv');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

dotenv.config();

const db = require('./models');

const clientRouter = require('./routes/client');
const barRouter = require('./routes/staff');

const app = express();

const myStore = new SequelizeStore({
  db: db.sequelize,
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.disable('x-powered-by');

require('./config/passport')(passport);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true, // true = .sass and false = .scss
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());
app.use(helmet());

if (process.env.ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(session({
  secret: process.env.EXPRESS_SESSION_SECRET,
  store: myStore,
  resave: process.env.ENV === 'development',
  proxy: process.env.ENV !== 'development',
  saveUninitialized: false,
  cookie: {
    maxAge: 60000
  }
}));

myStore.sync();

app.use((req, res, next) => {
  res.locals.errors = req.flash('error');
  res.locals.successes = req.flash('success');
  next();
});

app.use(passport.initialize());
app.use(passport.session());

app.use('/', clientRouter);
app.use('/', barRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
