module.exports = {
  // eslint-disable-next-line consistent-return
  ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    console.log('Please log in to view that resource');
    res.redirect('/login');
  },
  // eslint-disable-next-line consistent-return
  forwardAuthenticated(req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  },
};
