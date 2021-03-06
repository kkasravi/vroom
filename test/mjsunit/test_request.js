var helpers = require("../test_helpers");
var assertMatch = helpers.assertMatch;

// Setup the Mocks
var MockReq = require("./mock/req");
var MockRes = require("./mock/res");

exports.beforeEach = function () {
  var Vroom = require('../../lib/vroom');
  
  this.req = MockReq.mock({
    path: "/people",
    query: "page=2&name=ray",
    params: {page: '2', name: 'ray'},
    method: 'HEAD',
    host: 'localhost'
  });
  this.res = MockRes.mock();
  this.request = new Vroom.Request({}, this.req, this.res);
};


exports.tests = [

  function test_param() {
    assertMatch({page: '2', name: 'ray'}, this.request.params);
  },
  
  function test_method() {
    assertMatch('GET', this.request.method);
  },
  
  function test_actualMethod() {
    assertMatch('HEAD', this.request.actualMethod);
  },
  
  function test_path() {
    assertMatch('/people', this.request.path);
  },
  
  function test_protocol() {
    assertMatch('http', this.request.protocol);
  },
  
  function test_host() {
    assertMatch('localhost', this.request.host);
  },
  
  function test_status() {
    assertMatch(null, this.request.status);
    this.request.status = "500";
    assertMatch(500, this.request.status);
    this.request.status = 200;
    assertMatch(200, this.request.status);
  },
  
  function test_header() {
    assertMatch([], this.request.header);
    this.request.addHeader('Content-Type', 'text/html');
    assertMatch([['Content-Type', 'text/html']], this.request.header);
    this.request.removeHeader('Content-Type');
    assertMatch([], this.request.header);
  },
  
  function test_sendHeader() {
    var resSendHeaderCalled = false;
    this.res.sendHeader = function (status, header) {
      assertMatch(200, status);
      assertMatch([['Content-Type', 'text/html']], header);
      resSendHeaderCalled = true;
    };
    
    this.request.status = 200;
    this.request.addHeader('Content-Type', 'text/html');
    this.request.sendHeader();
    assertMatch(true, this.request.hasSentHeader);
    
    return function () {
      assertMatch(true, resSendHeaderCalled);
    }
  },
  
  function test_write() {
    var resSendBodyCalled = false;
    this.res.sendBody = function (str) {
      assertMatch("Hello World", str);
      resSendBodyCalled = true;
    };
    
    this.request.sendHeader();
    this.request.write("Hello World");
    
    return function () {
      assertMatch(true, resSendBodyCalled);
    };
  },
  
  function test_finish() {
    this.request.sendHeader();
    this.request.finish();
    assertTrue(true, this.request.finished);
  },
  
  function test_getCookie() {
    this.req.headers = { Cookie : 'vroom=node' };
    assertMatch('node', this.request.cookie.vroom);
    
    this.req.headers = { Cookie : 'vroom=node; ray=morgan; ian=myers' };
    assertMatch('node', this.request.cookie.vroom);
    assertMatch('morgan', this.request.cookie.ray);
    assertMatch('myers', this.request.cookie.ian);
    
    this.req.headers = {};
    assertMatch(undefined, this.request.cookie.vroom)
  },
  
  function test_setCookie() {
    this.res.sendHeader = function (status, header) {
      assertMatch([['Set-Cookie', 'vroom=node; path=/; domain=localhost']], header);
    };
    
    this.request.status = 200;
    this.request.setCookie('vroom', 'node', { path : '/', domain : 'localhost' });
    this.request.sendHeader();
  },
  
  function test_deleteCookie() {
    this.res.sendHeader = function (status, header) {
      assertMatch([['Set-Cookie', 'vroom=null; expires=Thu, 2 Aug 2001 20:47:11 UTC']], header);
    };
    
    this.request.status = 200;
    this.request.deleteCookie('vroom');
    this.request.sendHeader();
  }
];
