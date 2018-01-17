// const User = require('../app/models/user')
// const Swipe = require('../app/models/swipe')
const db = require('../app/models/')

module.exports = function(app, passport) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index');
    });

    // PROFILE SECTION =========================
    // app.get('/profile', isLoggedIn, function(req, res) {
    //     res.render('profile', {
    //         user : req.user
    //     });
    // });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        req.session.destroy();
        res.redirect('/');
    });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form


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
        //
        // app.post('/userInfo', function (req,res){
        //   let {age, img, bio, gender, seeking} = req.body;
        //   //{age,bio,img,gender,seeking}
        //   User
        //     .update({username: req.user.username},{$set: {age: age,bio: bio,img: img,gender: gender,seeking: seeking}} )
        //     .then(user => {
        //
        //       res.render('userView')
        //     })
        //     .catch(err => console.log(err))
        // })

      app.get('/userView', isLoggedIn, function (req,res){
        db.User
          .findOne({username: req.user.username})
          .populate('matches')
          .populate('rightSwipes')
          .populate('leftSwipes')
          .then(currentUser => {
            db.User
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
              // connections: currentUser.matches
              // console.log(users)
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
        db.User
          .findOneAndUpdate({username: req.user.username}, {$set:req.body})
          .then(result => res.sendStatus(200))
          .catch(err => res.json(err));
      });

      app.post('/swipe', function (req,res){
        //A = current user;
        let userA = req.user._id
        //B = user who was swiped on
        let userB = '';
        let matchedUser = '';
        let swipe = req.body.swipe
        //find id of user B
        db.User
          .findOne({username: req.body.username})
          .then(user => {
            userB = user._id
            matchedUser = user;
            let newSwipe = new Swipe({
            swiper: userA,
            swipee: userB,
            swipe: swipe
            });
            db.Swipe
              .create(newSwipe)
              .then(result => {
                if (swipe) {
                  db.Swipe
                    .findOne({swiper: userB, swipee: userA})
                    .then(swipeDoc => {
                      if (swipeDoc){
                        if (swipeDoc.swipe) {
                          db.User
                            .findOneAndUpdate({_id: userA}, {$push:{rightSwipes: userB, matches: userB}})
                            .then( result => {
                              db.User
                                .findOneAndUpdate({_id: userB}, {$push:{matches: userB}})
                                .then(result =>{
                                  res.json(matchedUser);
                                })
                                .catch(err=> console.log(err));
                            })
                            .catch(err=> console.log(err));
                        }
                      } else {
                        db.User
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
                  db.User
                    .findOneAndUpdate({_id: userA}, {$push:{leftSwipes: userB, matches: userB}})
                    .then( result => {
                      console.log('finished:',result)
                      res.json(result)
                    })
                    .catch(err=> console.log(err));
                }
              })
              .catch(err=>console.log(err))

          })
          .catch(err=> console.log(err));
      })//end of post to /swipe
};


// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
