
const LocalStrategy    = require('passport-local').Strategy;
const User = require('../app/models/user');


module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        // usernameField : 'userName',
        // passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, username,password, done) {

        // asynchronous
        process.nextTick(function() {
            User
              .findOne({ 'username' :  req.body.username })
              .then(user => {
                // if no user is found, return the message
                if (!user){
                  return done(null, false, req.flash('loginMessage', 'No user found.'));
                } else if (!user.validPassword(password)) {
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
                } else {
                  return done(null,user)
                }
              })
              .catch(err=>console.log(err));
        });

    }));

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        // usernameField : 'userName',
        // passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, username, password,done) {
        // asynchronous
        process.nextTick(function() {
            // if the user is not already logged in:
            if (!req.user) {
                User
                  .findOne({ 'username' :  req.body.username })
                  .then( result => {
                    // check to see if theres already a user with that email
                    if (result) {
                        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                    } else {
                        // create the user
                        let newUser = new User(req.body);

                        newUser.password = newUser.generateHash(req.body.password);
                        newUser.img = newUser.gender === 'm' ? '/img/default_man.jpg' : '/img/default_woman.jpg';

                        User
                          .create(newUser, function (err,result){
                            if (err){
                              return done(err)
                            } else {
                              return done(null,newUser)
                            }
                          });

                    }
                  })
                  .catch(err=>console.log(err));

        }//end if statement
      });//end process.nextTick
    }));//end passport.use
};//end module.exports
