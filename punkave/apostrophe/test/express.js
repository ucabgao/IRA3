var assert = require('assert');
var _ = require('lodash');
var apos;

describe('Express', function(){

  it('express should exist on the apos object', function(done){
    apos = require('../index.js')({
      root: module,
      shortName: 'test',
      hostName: 'test.com',
      modules: {
        'apostrophe-express': {
          secret: 'xxx',
          port: 7936
        },
        'express-test': {},
        'templates-test': {},
        'templates-subclass-test': {}
      },
      afterInit: function(callback) {
        assert(apos.express);
        // In tests this will be the name of the test file,
        // so override that in order to get apostrophe to
        // listen normally and not try to run a task. -Tom
        apos.argv._ = [];
        return callback(null);
      },
      afterListen: function(err) {
        assert(!err);
        done();
      }
    });
  });

  it('app should exist on the apos object', function() {
    assert(apos.app);
  });

  it('baseApp should exist on the apos object', function() {
    assert(apos.baseApp);
  });

  it('app and baseApp should be the same in the absence of a prefix', function() {
    assert(apos.baseApp === apos.app);
  });

  var request = require('request');

  var jar;

  function getCsrfToken(jar) {
    var csrfCookie = _.find(jar.getCookies('http://localhost:7936/'), { key: 'XSRF-TOKEN' });
    if (!csrfCookie) {
      return null;
    }
    var csrfToken = csrfCookie.value;
    return csrfToken;
  }

  it('should successfully make a GET request to establish CSRF', function(done) {
    // otherwise request does not track cookies
    jar = request.jar();
    request({
      method: 'GET',
      url: 'http://localhost:7936/tests/welcome',
      jar: jar
    }, function(err, response, body) {
      assert(body.toString() === 'ok');
      done();
    });
  });

  it('should flunk a POST request with no X-XSRF-TOKEN header', function(done){
    request({
      method: 'POST',
      url: 'http://localhost:7936/tests/body',
      form: {
        person: {
          age: '30'
        }
      },
      jar: jar,
      headers: {}
    }, function(err, response, body) {
      assert(response.statusCode === 403);
      done();
    });
  });

  it('should flunk a POST request with no cookies at all', function(done){
    request({
      method: 'POST',
      url: 'http://localhost:7936/tests/body',
      form: {
        person: {
          age: '30'
        }
      },
      headers: {}
    }, function(err, response, body) {
      assert(response.statusCode === 403);
      done();
    });
  });

  it('should flunk a POST request with the wrong CSRF token', function(done){
    var csrfToken = 'BOGOSITY';
    request({
      method: 'POST',
      url: 'http://localhost:7936/tests/body',
      form: {
        person: {
          age: '30'
        }
      },
      jar: jar,
      headers: {
        'X-XSRF-TOKEN': csrfToken
      }
    }, function(err, response, body) {
      assert(response.statusCode === 403);
      done();
    });
  });

  it('should use the extended bodyParser for submitted forms', function(done) {
    var csrfToken = getCsrfToken(jar);
    assert(csrfToken);
  	request({
  		method: 'POST',
  		url: 'http://localhost:7936/tests/body',
  		form: {
  			person: {
  				age: '30'
  			}
  		},
      jar: jar,
      headers: {
        'X-XSRF-TOKEN': csrfToken
      }
  	}, function(err, response, body) {
  		assert(body.toString() === '30');
  		done();
  	});
  });

  it('should allow us to implement a route that requires the JSON bodyParser', function(done) {
    var csrfToken = getCsrfToken(jar);
    request({
      method: 'POST',
      url: 'http://localhost:7936/tests/body',
      json: {
        person: {
          age: '30'
        }
      },
      jar: jar,
      headers: {
        'X-XSRF-TOKEN': csrfToken
      }
    }, function(err, response, body) {
      assert(body.toString() === '30');
      done();
    });
  });

  it('should be able to implement a route with apostrophe-module.route', function(done) {
    var csrfToken = getCsrfToken(jar);
    request({
      method: 'POST',
      url: 'http://localhost:7936/modules/express-test/test2',
      json: {
        person: {
          age: '30'
        }
      },
      jar: jar,
      headers: {
        'X-XSRF-TOKEN': csrfToken
      }
    }, function(err, response, body) {
      assert(body.toString() === '30');
      done();
    });
  });

  // PREFIX STUFF

 	it('should set prefix on the apos object if passed in', function(done){
 		apos = require('../index.js')({
      root: module,
      shortName: 'test',
      hostName: 'test.com',
      prefix: '/prefix',
      modules: {
        'apostrophe-express': {
          port: 7937,
          csrf: false
        },
        'express-test': {},
        'templates-test': {},
        'templates-subclass-test': {}
      },
      afterInit: function(callback) {
        assert(apos.prefix);
        assert(apos.prefix === '/prefix');
        // In tests this will be the name of the test file,
        // so override that in order to get apostrophe to
        // listen normally and not try to run a task. -Tom
        apos.argv._ = [];
        return callback(null);
      },
      afterListen: function(err) {
        assert(!err);
        done();
      }
    });
 	});

 	it('should have different baseApp and app properties with a prefix', function(){
 		assert(apos.app !== apos.baseApp);
 	});

 	it('should take same requests at the prefix', function(done){
    request({
  		method: 'POST',
  		url: 'http://localhost:7937/prefix/tests/body',
  		form: {
  			person: {
  				age: '30'
  			}
  		}
  	}, function(err, response, body) {
  		assert(body.toString() === '30');
  		done();
  	});
  });

});
