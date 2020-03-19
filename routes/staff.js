var express = require('express');
var router = express.Router();
const passport = require('passport');
const db = require('../models');
const bcrypt = require("bcrypt");

const { forwardAuthenticated, ensureAuthenticated } = require('../config/auth');

/* GET users listing. */
router.get('/admin', ensureAuthenticated, function(req, res, next) {
  res.render('admin', { title: 'Admin', iokey: `'${process.env.IO_SECRET}'` });
});

router.get('/barman', ensureAuthenticated, function(req, res, next) {
  res.render('barman', { title: 'Barman', iokey: `'${process.env.IO_SECRET}'` });
});

router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Login' });
});

router.post('/login', (req, res, next) => {
  req.flash('success', 'Vous êtes connecté');
  passport.authenticate('local', {
    successRedirect: '/admin',
    failureRedirect: '/login',
    failureFlash: true,
    successFlash: true,
  })(req, res, next);
});

router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success', 'Vous êtes déconnecté');
  res.redirect('/');
});

router.get('/register', function(req, res, next) {
  console.log(process.env.REGISTRATION);
  if (process.env.REGISTRATION) {
    res.render('register', { title: 'Register' });
  } else {
    res.status(404).send('Sorry cant find that!')
  }
});

router.post('/register', (req, res) => {
  if (process.env.REGISTRATION) {
    const {
      username, password
    } = req.body;
    const title = "Register";
    const errors = [];
    if (!username || !password) {
      errors.push({ msg: 'Veuillez remplir tous les champs' });
    }

    db.User.findAll()
      .then((listuser) => {
        if (errors.length > 0) {
          res.render('register', {
            errors,
            title,
            listuser,
            username,
            });
        } else {
          db.User.findOne({ where: { login: username } })
            .then((user) => {
              if (user) {
                errors.push({ msg: 'Ce login existe déjà' });
                res.render('register', {
                    errors,
                    title,
                    listuser,
                    username,
                  });
              } else {
                const newUser = new db.User({
                  login: username,
                  password,
                });
                bcrypt.genSalt(10, (err, salt) => {
                  bcrypt.hash(newUser.password, salt, (error, hash) => {
                    if (error) throw error;
                    newUser.password = hash;
                    newUser
                        .save()
                        .then((usr) => {
                          req.flash('success', 'L\'utilisateur a bien été créé');
                          res.redirect('/login');
                        }).catch((erre) => {
                      req.flash('error', 'Une erreur s\'est produite');
                      console.log(erre);
                      res.redirect('/register');
                    });
                  });
                });
              }
            }).catch((err) => {
              req.flash('error', 'Une erreur s\'est produite');
              console.log(err);
              res.redirect('/register');
            });
        }
      }).catch((err) => {
        req.flash('error', 'Une erreur s\'est produite');
        console.log(err);
        res.redirect('/register');
      });
  } else {
    res.status(404).send('Sorry cant find that!')
  }
});


module.exports = router;
