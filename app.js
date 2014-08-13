
var express = require('express');
var passport = require('passport');
var flash = require('connect-flash');
var LocalStrategy = require('passport-local').Strategy;
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var methodOverride = require('method-override');
var logger = require('morgan');
var expressValidator = require('express-validator');
var _ = require("underscore");


var users = [
    { id: 1, firstname : 'bob', lastname : 'booth', username: 'bob', password: 'secret', email: 'bob@example.com' }
    , { id: 2, firstname : 'joe', lastname : 'jones', username: 'joe', password: 'birthday', email: 'joe@example.com' }
];

var addUser = function(user, next){
    var existingUser = _.findWhere(users, { username : user.username });
    if (!existingUser) {
        user.id = users.length + 1;
        users.push(user);
        next(null, user);
    }
    else {
        var error = {
            message : ("User already exists with user name:" + user.username)
        };
        next(error, user);
    }
};

var findById = function(id, next) {
    var idx = id - 1;
    if (users[idx]) {
        next(null, users[idx]);
    } else {
        next(new Error('User ' + id + ' does not exist'));
    }
};

var findByUsername = function(username, fn) {
    for (var i = 0, len = users.length; i < len; i++) {
        var user = users[i];
        if (user.username === username) {
            return fn(null, user);
        }
    }
    return fn(null, null);
};

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new LocalStrategy(function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

        findByUsername(username, function(err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
            if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
            return done(null, user);
        })
    });
}
));


var app = express();

// configure Express// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser());
app.use(expressValidator());

app.use(methodOverride());
app.use(session({ secret: 'keyboard cat' }));
app.use(flash());
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
    res.render('index', { user: req.user });
});

app.get('/adduser', ensureAuthenticated, function(req, res){
    res.render('adduser', { user: req.user });
});

app.post('/login',
    passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
    function(req, res) {
        res.redirect('/adduser');
});

app.get('/login', function(req, res){
    res.render('login', { user: req.user, message: req.flash('error') });
});

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

app.get('/users', function(req,res) {
    res.render('users', { users : users });
});

app.get('/adduser', function(req,res) {
    res.render('adduser', {
        user : {},
        errors: null
    });
});

app.post('/adduser', function(req,res) {

//    expressValidator.validator.extend('isUsernameUnique', function (userName) {
//        findByUsername(userName, function(err, user){
//            var isUnique = !(user);
//            return isUnique;
//        });
//
//    });

    req.assert('firstname', 'First name is required').notEmpty();
    req.assert('lastname', 'Last name is required').notEmpty();
    req.assert('username', 'User name is required').notEmpty();
    req.assert('password', 'Password is required').notEmpty();
    req.assert('email', 'A valid email is required').isEmail();
    //req.assert('username', 'User name is not unique').isUsernameUnique();

    var errors = req.validationErrors();
    if( !errors){
        addUser(_.clone(req.body), function(err, user){
            if (!err){
                res.redirect('/users');
            }
        });
    }
    else {   //Display errors to user
        res.render('adduser', {
            user : req.body,
            errors: errors
        });
    }
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
}

module.exports = app;