'use strict';

import request from 'superagent';
import Debug from 'debug';
const debug = Debug('nine2five:github-oauth-middleware');

module.exports = function(req, res, next) {
  debug('getting Github user info');

  if (req.query.error) {
    req.githubError = new Error(req.query.error);
    return next();
  }

  let data = {
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    state: process.env.GITHUB_CLIENT_SECRET, // randon string
    code: req.query.code,
    redirect_uri: `${process.env.API_URL}/api/oauth/github`,
  //  grant_type: 'authorization_code',
  };

  let accessToken, scope, token_type;
  request.post('https://github.com/login/oauth/access_token')
  .type('form')
  .send(data)
  .then(response => {
    accessToken = response.body.access_token;
    scope = response.body.scope;
    token_type = response.body.token_type;
    return request.get('https://api.github.com/user')
    .set('Authorization', `token ${response.body.access_token}`);
  })
  .then(response => {
    debug('github-oauth-middleware response after request', response.body);
    req.githubOAUTH = {
      githubID: response.body.sub,
      email: response.body.email,
    };
    next();
  })
  .catch((err) => {
    req.googleError = err;
    next();
  });
};
