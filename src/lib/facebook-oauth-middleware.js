'use strict';

import request from 'superagent';
import Debug from 'debug';
const debug = Debug('nine2five:facebook-oauth-middleware');

module.exports = function(req, res, next){
  debug('getting facebook user info');

  if (req.query.error) {
    req.googleError = new Error(req.query.error);
    return next();
  }

  let data = {
    code: `code=${req.query.code}`,
    client_id: `client_id=${process.env.FACEBOOK_CLIENT_ID}`,
    client_secret: `client_secret=${process.env.FACEBOOK_CLIENT_SECRET}`,
    redirect_uri: `redirect_uri=${process.env.API_URL}/api/oauth/facebook`,
  };

  let accessToken, tokenTTL;

  request.get(`https://graph.facebook.com/v2.8/oauth/access_token?${data.client_id}&${data.redirect_uri}&${data.client_secret}&${data.code}`)
  .then( response => {
    accessToken = response.body.access_token;
    tokenTTL = response.body.expires_in;
    return request.get(`https://graph.facebook.com/v2.8/me?access_token=${accessToken}&fields=id,name,email`);
  })
  .then(response => {
    let parsed = JSON.parse(response.text);
    req.facebookOAUTH = {
      facebookID: parsed.id,
      email: parsed.email,
      tokenTTL,
      accessToken,
    };
    next();
  })
  .catch( (err) => {
    req.facebookError = err;
    next();
  });
};
