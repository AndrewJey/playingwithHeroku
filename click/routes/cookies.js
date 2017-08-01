var express = require('express');
var router = express.Router();
var cookieParser = require('cookie-parser');

router.get('/cookie/:contador',function(req, res){
  res.cookie('contador' , req.params.contador).send('setiada');
});

router.get('/', function(req, res) {
    res.json({cookies: req.cookies.contador});;
});

router.get('/clearcookie', function(req,res){
  res.clearCookie('contador').send('limpia');
});

module.exports = router;
