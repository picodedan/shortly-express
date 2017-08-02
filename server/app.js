const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');  // Not used by default, we have to use this...
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');  // Not used by default, we have to use this to build our Auth protocol
const models = require('./models');  // These have tons of functions we may or may not have to use... TBD.


const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.use(require('./middleware/cookieParser'));
app.use(Auth.createSession);

// This will get us the root of the domain.
app.get('/', Auth.verifySession, 
(req, res) => {
  res.render('index');
});
// This is the /create endpoint for the domain, this should send us to whatever page helps create a new link.  This takes to the page where there is a 'shorten' submit field that will shorten our URL.
app.get('/create', Auth.verifySession, 
(req, res) => {
  res.render('index');
});
// Visiting this endpoint takes us to all of the current website that exist within the database.

// Typing in a website's code on the base URL takes us directly to that website via a shortened link.

app.get('/links', Auth.verifySession, 
(req, res, next) => {
  models.Links.getAll()
    .then(links => {
      res.status(200).send(links);
    })
    .error(error => {
      res.status(500).send(error);
    });
});

app.post('/links', Auth.verifySession, 
(req, res, next) => {
  var url = req.body.url;
  if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
    return res.sendStatus(404);
  }

  return models.Links.get({ url })
    .then(link => {
      if (link) {
        throw link;
      }
      return models.Links.getUrlTitle(url);
    })
    .then(title => {
      return models.Links.create({
        url: url,
        title: title,
        baseUrl: req.headers.origin
      });
    })
    .then(results => {
      return models.Links.get({ id: results.insertId });
    })
    .then(link => {
      throw link;
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(link => {
      res.status(200).send(link);
    });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

//get method for user authentication 
  //user supplied ID and password
  //get user data +salt + stored hash
  //return positive or negatve authentication result 
    //possibly + cookie thingy 

//post method for new user creation
//app.post('/signup', )
app.post('/signup', 
(req, res) => {
  models.Users.create(req.body)
    .then(success => {
      // Get the user id using success.in
      res.redirect('/');  
    })
    .catch(error => {
      res.redirect('/signup');
    });
});

app.post('/login',
  (req, res) => {
    let user = {
      username: req.body.username
    };
    models.Users.get(user)
    .then(user => {
      if (models.Users.compare(req.body.password, user.password, user.salt)) {
        res.redirect('/');
      } else {
        res.redirect('/login');
      }
    })
    .catch(error => {
      res.redirect('/login');
    });
  });


/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
