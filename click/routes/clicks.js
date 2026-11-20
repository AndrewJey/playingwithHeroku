var express = require('express');
var router = express.Router();
var models = require('../models');

router.get('/', function (req, res, next) {
  models.clicks.findAll().then(function (clicks) {
    res.format({
      json: function () { res.json({ clicks: clicks }); },
      html: function () { res.render('index', { clicks: clicks }); }
    });
  }).catch(next);
});

router.post('/', function (req, res, next) {
  var count = Math.max(0, Math.trunc(Number(req.body.count) || 0));
  models.clicks.create({ count: count }).then(function (created) {
    res.format({
      json: function () { res.status(201).json(created); },
      html: function () { res.redirect('/'); }
    });
  }).catch(next);
});

router.put('/:id', function (req, res, next) {
  var count = Math.max(0, Math.trunc(Number(req.body.count) || 0));
  models.clicks.update({ count: count }, { where: { id: req.params.id } }).then(function (updated) {
    res.format({
      json: function () { res.json({ updated: updated[0], count: count }); },
      html: function () { res.redirect('/'); }
    });
  }).catch(next);
});

router.delete('/:id', function (req, res, next) {
  models.clicks.destroy({ where: { id: req.params.id } }).then(function (deleted) {
    res.json({ deleted: deleted });
  }).catch(next);
});

module.exports = router;
