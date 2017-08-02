const models = require('../models');
const Promise = require('bluebird');
/*
var createNewSession = function(req, res, next) {
  models.Sessions.create()
    .then(success => {
      return models.Sessions.get({ id: success.insertId });
    })
    .then(session => {
      req.session = {
        hash: session.hash,
      };
      res.cookies = {
        shortlyid: {value: session.hash}
      };
      next(req, res);
    })
  .catch(err => {
    throw err;
  });
};

var updateSessionInfo = function(req, res, next) {
  models.Sessions.get({ hash: req.cookies.shortlyid })
  .then(session => {
    req.session = {
      hash: session.hash,
      userId: session.userId,
      user: session.user
    };
    res.cookies = {
      shortlyid: {value: session.hash}
    };
    next(req, res);
  })
  .catch(error => {
    createNewSession(req, res, next);
  });
};
*/

module.exports.createSession = (req, res, next) => {
  // check if req has cookies
  Promise.resolve(req.cookies.shortlyid)
    //if req has shortly cookie,
  .then(hash => {
    //check if cookie is valid
    if (!hash) {
      throw hash;
    }
    return models.Sessions.get({ hash });
  })
  .tap(session => {
    //if not valid
    if (!session) {
      throw session;
    }
  }).catch(() => {
      //if req has no cookie or session was invalid
    return models.Sessions.create()
      //create session 
      .then(results => {
        return models.Sessions.get({ id: results.insertId });
      })
      .tap(session => {
        //set cookie
        res.cookie('shortlyid', session.hash);
      });
  })
  .then (session => {
    //add session obj to req for internal tracking. 
    req.session = session;
    next();
  });
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

module.exports.verifySession = function (req, res, next) {
  //verify users session 
  //take req obj
  if (!models.Sessions.isLoggedIn(req.session)) {
    res.redirect('/login');
  } else {
    next();
  }
    //if resolve 
      //next
    //if reject
      //res.redirect to login
};
