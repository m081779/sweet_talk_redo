// server.js

// set up ======================================================================
// get all the tools we need
const express  = require('express');
const app      = express();
const PORT     = process.env.PORT || 3000;
const mongoose = require('mongoose');
const passport = require('passport');
const flash    = require('connect-flash');
const path = require('path');
const exphbs  = require('express-handlebars');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser   = require('body-parser');
const session      = require('express-session');

const config = require('./config/database.js');
app.use(express.static(path.join(__dirname, 'public')))
// configuration ===============================================================
mongoose.Promise = Promise;
mongoose
  .connect(config.database)
  .then( result => {

    console.log(`Connected to database '${result.connections[0].name}' on ${result.connections[0].host}:${result.connections[0].port}`)
  })
  .catch(err => console.log('There was an error with your connection:', err));

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));

app.engine('hbs', exphbs({defaultLayout: 'main', extname: '.hbs'}));
app.set('view engine', '.hbs');

// required for passport
const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({
  uri: config.database,
  collection: 'mySessions'
});

store
  .on('error', function(error) {
    assert.ifError(error);
    assert.ok(false);
  });
app.use(session({
    secret: '52e0d0v5h5t5r2e0s0s2cvb1j1j2k25u', // session secret
    resave: false,
    saveUninitialized: false,
    store: store
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(PORT, function () {
  console.log(`Server listening on localhost:${PORT}`)
});
