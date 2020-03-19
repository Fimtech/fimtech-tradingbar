var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Trading Bar' });
});

router.get('/table', function(req, res, next) {
  res.render('simplified', { title: 'Simplified' });
});






module.exports = router;
