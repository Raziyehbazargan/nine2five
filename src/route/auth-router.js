'use strict';

const Router = require('express').Router;
const jsonParser = require('body-parser').json();
const createError = require('http-errors');
const debug = require('debug')('nine2five:auth-router');

const User = require('../lib/db-connection').user;
const basicAuth = require('../lib/basic-auth-middleware');
const bearerAuth = require('../lib/bearer-auth-middleware');
const googleOAUTH = require('../lib/google-oauth-middleware');
const linkedinOAUTH = require('../lib/linkedin-oauth-middleware');

const authRouter = module.exports = Router();

authRouter.post('/api/signup', jsonParser, function(req, res, next){
  debug('/api/signup route');

  let password = req.body.password;
  delete req.body.password;

  if (!req.body.email)
    return next(createError(400, 'Email required'));
  if (!password)
    return next(createError(400, 'Password required'));
  if (password.length < 8)
    return next(createError(400, 'Password should be at least 8 characters long'));

  User.generatePasswordHash(password)
  .then(hash => {
    return User.create({
      email : req.body.email,
      password: hash,
    });
  })
  .then(user => user.generateToken())
  .then(token => res.send(token))
  .catch(next);
});

authRouter.get('/api/login', basicAuth, function(req, res, next){
  debug('/api/login route');

  User.findOne({ where: {email: req.auth.email} })
  .then( user => {
    if (!user) return next(createError(401, 'User not found'));
    return user.comparePasswordHash(req.auth.password);
  })
  .catch(err => next(createError(401, err.message)))
  .then( user => user.generateToken())
  .then(token => res.send(token))
  .catch(next);
});

authRouter.get('/api/oauth/google', googleOAUTH, function(req, res, next) {
  debug('GET /api/oauth/google');

  if(req.googleError) {
    //return res.redirect('to login page');
  }

  //check if user already exists
  User.findOne({where : {email: req.googleOAUTH.email} })
  .then(user => {
    if(!user) return next(createError(401, 'User not found'));
    return user;
  })
  .catch( err => {
    if(err.message === 'user not found') {
      let userData = {
        email: req.googleOAUTH.email,
        google :{
          googleID: req.googleOAUTH.googleID,
          tokenTTL: req.googleOAUTH.tokenTTL,
          tokenTimestamp: Date.now(),
          refreshToken: req.googleOAUTH.refreshToken,
          accessToken: req.googleOAUTH.accessToken,
        },
      };
      return User.create(userData);
    }
    return next(err);
  })
  .then(user => user.generateToken())
  .then(token => {
    res.redirect(`/#/login/?token=${token}`);
    return token;
  })
  .catch(err => {
    //res.redirect('to login page');
  });
});

authRouter.get('/api/oauth/linkedin', linkedinOAUTH, function(req, res, next) {
  debug('GET /api/oauth/linkedin');

  if(req.linkedinError) {
    //return res.redirect('/#/login');
  }

  //check if user already exists
  User.findOne({where : {linkedinID: req.linkedinOAUTH.linkedinID} })
  .then(user => {
    if(!user) return next(createError(401, 'User not found'));
    return user;
  })
  .catch( err => {
    if(err.message === 'user not found') {
      let userData = {
        email: req.linkedinOAUTH.email,
        linkedin :{
          linkedinID: req.linkedinOAUTH.googleID,
          tokenTTL: req.linkedinOAUTH.tokenTTL,
          tokenTimestamp: Date.now(),
          refreshToken: req.linkedinOAUTH.refreshToken,
          accessToken: req.linkedinOAUTH.accessToken,
        },
      };
      return User.create(userData);
    }
    return next(err);
  })
  .then(user => user.generateToken())
  .then(token => {
    //res.redirect(`/#/login/?token=${token}`);
    return token;
  })
  .catch(err => {
    //res.redirect('/#/login');
  });
});
