var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
     res.send(req.session.value);
});

router.post('/', function (req, res, next) {
    req.session.value = req.body.value;
    res.send(req.session.value);
});


module.exports = router;
