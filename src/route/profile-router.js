'use strict';

const Router = require('express').Router;
const jsonParser = require('body-parser').json();
const createError = require('http-errors');
const debug = require('debug')('nine2five:auth-router');

const User = require('../lib/db-connection').user;
const Profile = require('../lib/db-connection').profile;

const basicAuth = require('../lib/basic-auth-middleware');
const bearerAuth = require('../lib/bearer-auth-middleware');

const profileRouter = module.exports = Router();

profileRouter.post('/api/profile', bearerAuth, jsonParser, function(req, res, next) {
  debug('/api/profile route');

  if(!req.body) return next(createError(401, 'profile data not found'));

  Profile.create(req.body)
  .then(profile => res.json(profile))
  .catch(next);

});

profileRouter.get('/api/profile', bearerAuth, jsonParser, function(req, res, next) {
  debug('/api/profile route');

  if(!req.body) return next(createError(401, 'profile data not found'));

  Profile.findOne({where : {userID: req.user._id} })
  .then(user => {
    if(!user) return next(createError(401, 'Profile not found'));
    return user;
  })
  .then(profile => res.json(profile))
  .catch(next);

});

// profileRouter.put('/api/profile', bearerAuth, jsonParser, function(req, res, next) {
//   debug('/api/profile route');
//
//   if(!req.body) return next(createError(401, 'profile data not found'));
//
//   Profile.update({req.body},{where: {id: req.user._id}})
//   .then(profile => res.json(profile))
//   .catch(next);
//
// });
