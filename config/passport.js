const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

// Load User model
const db = require('../models');

module.exports = (passport) => {
  passport.use(
    new LocalStrategy({ username: 'username' }, (username, password, done) => {
      db.User.findOne({
        where: {
          login: username,
        },
        // eslint-disable-next-line consistent-return
      }).then((user) => {
        if (!user) {
          return done(null, false, { message: 'Ce nom d\'utilisateur n\'existe pas' });
        }

        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            return done(null, user, { message: 'Vous êtes connecté' });
          }
          return done(null, false, { message: 'Mot de passe incorrect' });
        });
      });
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    db.User.findOne({ where: { id: id } }).then((user) => {
      if (user) {
        done(null, user.get());
      } else {
        done(user.errors, null);
      }
    }).catch(e => console.log(e));
  });
};
