'use strict';

const expect = require('chai').expect;
const request = require('superagent');
const dotenv = require('dotenv');
dotenv.load({path: `${__dirname}/.testenv`});

const sequelize = require('../src/lib/db-connection').sequelize;
const serverCtrl = require('./lib/server-ctrl');
const server = require('../server');
const mockUser = require('./lib/mock-user');

const url = `http://localhost:${process.env.PORT}`;

const exampleUser = { email: 'at@hello.com', password: '12345678' };

describe('Testing Auth-Router', function() {

  before('create the db', () => {
    return serverCtrl.serverUp(server)
    .then(() => sequelize.sync({force: true}));
  });
  after('clear tables', () => {
    return serverCtrl.serverDown(server)
    .then(() => sequelize.drop({cascade: true}));
  });


  describe('testing user signup', () => {
    it('should successfully sign up a user', done => {

      request.post(`${url}/api/signup`)
      .send(exampleUser)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.status).to.equal(200);
        expect(res.text.length).to.not.equal(0);
        done();
      });
    });
  });

  describe('testing user login', function() {

    before('create a user', done =>
      mockUser.call(this, done));


    it('should successfully log in a user', done => {

      console.log(this.tempEmail);

      request.get(`${url}/api/login`)
      .auth(this.tempEmail, this.tempPassword)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.status).to.equal(200);
        expect(res.text.length).to.not.equal(0);
        done();
      });
    });
  });
});
