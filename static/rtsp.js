var vdo;
console.log("test");
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
  console.log('test');
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
    console.log('connected');
    sck.send('GET / HTTP/1.1\r\n\r\n');
  };
  sck.onrecv = function(data) {
    connect.log(data);
  };
}

function getSdp(host, port) {

  
};

// $(document).ready(function() {
console.log('1');
  // testhttp('www.google.com', 80);
// });
