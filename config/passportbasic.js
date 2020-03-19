const BasicStrategy = require('passport-http').BasicStrategy;

// Load User model
const db = require('../models');

module.exports = (passport) => {
  passport.use(new BasicStrategy(function(username, password, done) {
    db.User.findOne({
      where: {
        login: username,
      },
      // eslint-disable-next-line consistent-return
    }).then((user) => {
      if (!user) {
        return done(null, false, {message: 'Ce nom d\'utilisateur n\'existe pas'});
      }

      if (password === user.password) {
        return done(null, user, {message: 'Vous êtes connecté'});
      }
      return done(null, false, {message: 'Mot de passe incorrect'});
    });
  }));
};
