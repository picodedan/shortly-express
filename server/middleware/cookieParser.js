const parseCookies = (req, res, next) => {
  
  if ( req.headers.cookie) {
    let cookieArray = req.headers.cookie.split('; ');
    let cookiesObj = {};
    cookieArray.forEach((cookie) => {
      let crumbs = cookie.split('=');
      cookiesObj[crumbs[0].toString()] = crumbs[1];
    });
    req.cookies = cookiesObj;
  } else {
    req.cookies = {};
  }
  next();
  
};

module.exports = parseCookies;