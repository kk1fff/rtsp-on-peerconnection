var vdo;
var c = console;
function startRTSP(rawSdp) {
  var pc = new mozRTCPeerConnection();
  var offer = formOffer(rawSdp);

  function failed(err) {
    console.error("error: " + err);
  }

  pc.onaddstream = function(obj) {
    vdo.mozSrcObject(obj.stream);
    vdo.play();
  };

  pc.setRemoteDescription(offer, function() {
    pc.createAnswer(function(answer) {
      pc.setLocalDescription(answer, function() {
        console.log("ok");
      }, failed);
    }, failed);
  }, failed);
}

var DelegatedSocket = function(host, port) {
  c.log('DelegatedSocket');
  var socket = io.connect('http://localhost:8000');
  var self = this;
  socket.on('hello', function (data) {
    console.log('hello');
    socket.emit('connect', {
      host: host,
      port: port
    });
  });
  socket.on('connect-result', function(data) {
    self._done = data.ok;
    if (self.onconnected) {
      self.onconnected();
    }
  });

  socket.on('recv', function(data) {
    if (self.onrecv) {
      self.onrecv(data.data);
    };
  });

  this._socket = socket;
};

DelegatedSocket.prototype = {
  send: function(data) {
    this._socket.emit('send', { data: data });
  },
  close: function() {
    this._socket.emit('close');
  },
  onrecv: null,
  onconnected: null
};

function testhttp(host, port) {
  var sck = new DelegatedSocket(host, port);
  sck.onconnected = function() {
    c.log('connected');
    sck.send('OPTIONS rtsp://v3.cache2.c.youtube.com/CjYLENy73wIaLQl3D7QL_mpcsxMYDSANFEIJbXYtZ29vZ2xlSARSBXdhdGNoYM7uhMP11rrfTww=/0/0/0/video.3gp RTSP/1.0\r\n' +
             'CSeq: 1\r\n' +
             'User-Agent: RealMedia Player Version 6.0.9.1235 (linux-2.0-libc6-i386-gcc2.95)\r\n' +
             'ClientChallenge: 9e26d33f2984236010ef6253fb1887f7\r\n' +
             'CompanyID: KnKV4M4I/B2FjJ1TToLycw==\r\n' +
             'GUID: 00000000-0000-0000-0000-000000000000\r\n' +
             'RegionData: 0\r\n' +
             'PlayerStarttime: [28/03/2003:22:50:23 00:00]\r\n' +
             'ClientID: Linux_2.4_6.0.9.1235_play32_RN01_EN_586\r\n' +
//             'Date: Fri, 01 Feb 2013 03:02:22 GMT\r\n' +
             '\r\n');
  };
  sck.onrecv = function(data) {
    c.log(data);
  };
}

function getSdp(host, port) {

  
};

$(document).ready(function() {
  c.log('1');
  testhttp('74.125.214.50', 554);
});
