const User = require('../app/models/user')
const Swipe = require('../app/models/swipe')
// const = require('../app/models/')

module.exports = function(app, passport) {


    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index');
    });


// =============================================================================
// AUTHENTICATION ROUTES =======================================================
// =============================================================================
        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/userView', // redirect to the secure profile section
            failureRedirect : '/', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));


        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/userView', // redirect to the secure profile section
            failureRedirect : '/', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // LOGOUT ==============================
        app.get('/logout', function(req, res) {
          req.logout();
          req.session.destroy(function (err) {
            if (!err) {
                res.status(200).clearCookie('connect.sid', {path: '/'}).redirect('/');
            } else {
                console.log('Error from session destroy:', err)
            }
          });
        });

// =============================================================================
// USERVIEW ROUTES =============================================================
// =============================================================================
      app.get('/userView', isLoggedIn, function (req,res){
        User
          .findOne({username: req.user.username})
          .populate('matches')
          .populate('rightSwipes')
          .populate('leftSwipes')
          .then(currentUser => {
            console.log('currentuser after populate:', currentUser)
            User
            .find({gender: req.user.seeking, seeking: req.user.gender})
            .then(result => {
              let users = result.filter(user => {
                return  user.username !== req.user.username
              })
               users.forEach((user,i) => {
                 currentUser.matches.forEach(match => {
                   if (user._id===match._id){
                     users.splice(users[i],1)
                   }
                 })
               })
               users.forEach((user,i) => {
                 currentUser.rightSwipes.forEach(match => {
                   if (user._id===match._id){
                     users.splice(users[i],1)
                   }
                 })
               })
               users.forEach((user,i) => {
                 currentUser.leftSwipes.forEach(match => {
                   if (user._id===match._id){
                     users.splice(users[i],1)
                   }
                 })
               })
              let hbsObj = {
                currentUser: currentUser,
                users: users,
                connections: currentUser.matches
              }
              console.log('+++++++++++++++++++++++=',currentUser)
              res.render('userView', hbsObj)
            })
            .catch(err => res.json(err));
          })
          .catch(err => console.log(err));
      });

      app.post('/updateUser', isLoggedIn, function (req, res){
        User
          .findOneAndUpdate({username: req.user.username}, {$set:req.body})
          .then(result => res.sendStatus(200))
          .catch(err => res.json(err));
      });

      app.post('/swipe', function (req,res){
        //A = current user;
        let userA = req.user._id
        //B = user who was swiped on
        let userB = req.body.userId;
        let swipe = req.body.swipe
        //create new swipe
        let newSwipe = new Swipe({
        swiper: userA,
        swipee: userB,
        swipe: swipe
        });
        Swipe
          .create(newSwipe)
          .then(result => {
            //if swipe was true, check if userB has swiped on userA
            if (swipe) {
              Swipe
                .findOne({swiper: userB, swipee: userA})
                .then(swipeDoc => {
                  //if swipe document exists, and if swipe was true, then update userA and userB's match array
                  //and add userB to rightSwipes
                  if (swipeDoc){
                    if (swipeDoc.swipe) {
                      User
                        .findOneAndUpdate({_id: userA}, {$push:{rightSwipes: userB, matches: userB}})
                        .then( result => {
                          User
                            .findOneAndUpdate({_id: userB}, {$push:{matches: userB}})
                            .then(matchedUser =>{
                              //then send the new match to the front end
                              res.json(matchedUser);
                            })
                            .catch(err=> console.log(err));
                        })
                        .catch(err=> console.log(err));
                    }
                  } else {
                    //if userB hasn't swiped on userA, just push userB into rightSwipes
                    User
                      .findOneAndUpdate({_id: userA}, {$push:{rightSwipes: userB}})
                      .then( result =>{
                        console.log('finished:',result)
                        res.json(result)
                      })
                      .catch(err=> console.log(err));
                  }
                })
                .catch(err=> console.log(err));
            } else {
              //if swipe was false, add userB to leftSwipes
              User
                .findOneAndUpdate({_id: userA}, {$push:{leftSwipes: userB}})
                .then( result => {
                  console.log('finished:',result)
                  res.json(result)
                })
                .catch(err=> console.log(err));
            }
          })
          .catch(err=>console.log(err))

      })//end of post to /swipe
};


// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
