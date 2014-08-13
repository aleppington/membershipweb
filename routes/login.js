//var passport = require("passport");
//var express = require('express');
//var router = express.Router();
//
//var redirects = {
//    successRedirect : "/",
//    failureRedirect : "/",
//    failureFlash : false
//};
//
//    router.post("/account/login", passport.authenticate('local', redirects));
//};
//
//module.exports = AccountRoute;

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    res.render('login');
});

module.exports = router;