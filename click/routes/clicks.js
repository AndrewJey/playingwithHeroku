var express = require('express');
var router = express.Router();
var models = require('../models');

router.get('/', function(req, res, next) {
  res.format({
    json: function () {
      models.clicks.all().then(clicks => {
        res.json({clicks: clicks});
      });
    },
    html: function () {
      models.clicks.all().then(clicks => {
        res.render('/index', { clicks: clicks });
      });
    }
  });
});

router.post('/', function(req, res, next) {
  var clicks = models.clicks.create(req.body);
  res.format({
    json: function () {
      clicks.then(clicks => {res.json(clicks)});
    },
    html: function () {
      clicks.then(clicks => {res.redirect('/')});
    }
  })
});


router.put('/:id', function(req, res, next) {
  res.format({
    json: function() {
      models.clicks.update(req.body,{ where: {id: req.params.id} }).then(clicks => {
        res.json({clicks:clicks});
      });
    },
    html: function () {
      models.clicks.update(req.body,{ where: {id: req.params.id} }).then(clicks => {
        res.redirect('/', {clicks:clicks});
      });
    }
  });
});

module.exports = router;
