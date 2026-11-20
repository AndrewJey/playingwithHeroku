var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
  var value = Number(req.session.value) || 0;
  res.json({ value: value });
});

router.post('/', function (req, res) {
  var parsed = Number(req.body.value);
  req.session.value = Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0;
  res.json({ value: req.session.value });
});

module.exports = router;
