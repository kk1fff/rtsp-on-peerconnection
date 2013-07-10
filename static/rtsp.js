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
    try {
      this._socket.emit('send', { data: data });
    } catch (e) {
      console.log(e);
    }
  },
  close: function() {
    this._socket.emit('close');
  },
  onrecv: null,
  onconnected: null
};

var RTSP_INIT = 0,
    RTSP_OPTION_SENT = 1,
    RTSP_DESCRIBE_SENT = 2;

function RtspResponse(data) {
  function getOneLine(txt) {
    var i = txt.indexOf('\r\n');
    return [txt.slice(0, i), txt.slice(i+2)];
  }

  // parse header.
  var parsedStatusLine, i;
  [this.statusLine, data] = getOneLine(data);
  
  parsedStatusLine = /^RTSP\/([0-9\.]+) ([0-9]+) (\w+)$/.exec(this.statusLine);
  this.statusCode = parseInt(parsedStatusLine[2]);
  this.rtspVersion = parsedStatusLine[1];
  this.status = parsedStatusLine[3];

  this.headers = [];
  var tmp;
  [tmp, data] = getOneLine(data);
  while(tmp && tmp.length > 0 ) {
    var headerline = /^([^:]+):[ ]+(.+)$/.exec(tmp);
    this.headers.push([headerline[1], headerline[2]]);
    [tmp, data] = getOneLine(data);
  }
  this.content = data;
}

RtspResponse.prototype = {
  dump: function() {
    console.log("RtspResponse: " + this.statusLine + ", " + this.statusCode);
    console.log(" headers: " + JSON.stringify(this.headers));
  }
};

function testrtsp(host, port) {
  var sck = new DelegatedSocket(host, port);
  var self = this;
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
             'Date: ' + new Date() + '\r\n' +
             '\r\n');
    self._status = RTSP_OPTION_SENT;
    self._sck = sck;
    self._seq = 2;
  };
  sck.onrecv = function(data) {
    c.log(data);
    setTimeout(self.handleRtspResponse.bind(self), 0, data);
  };
}

testrtsp.prototype = {
  _status: RTSP_INIT,
  handleRtspResponse: function(data) {
    var resp = new RtspResponse(data);
    resp.dump();
    switch (this._status) {
    case RTSP_OPTION_SENT:
      if (resp.statusCode == 200) {
        // server says ok, we can send our description
        console.log("Will send describe");
        this._sck.send('DESCRIBE rtsp://v3.cache2.c.youtube.com/CjYLENy73wIaLQl3D7QL_mpcsxMYDSANFEIJbXYtZ29vZ2xlSARSBXdhdGNoYM7uhMP11rrfTww=/0/0/0/video.3gp RTSP/1.0\r\n' +
                       'CSeq:' + (this._seq++) + '\r\n' +
                       'Date: ' + new Date() + '\r\n' +
                       'Accept: application/sdp\r\n' +
                      '\r\n');
        this._status = RTSP_DESCRIBE_SENT;
      }
      break;
    case RTSP_DESCRIBE_SENT:
      // Got sdp.
      initPeerConnectionWithSdp(resp.content);
      break;
    }
  },
  sendPort: function(msg) {
    this._sck.send("SETUP rtsp://v3.cache2.c.youtube.com/CjYLENy73wIaLQl3D7QL_mpcsxMYDSANFEIJbXYtZ29vZ2xlSARSBXdhdGNoYM7uhMP11rrfTww=/0/0/0/video.3gp/trackID=0 RTSP/1.0\r\n"+
                   "CSeq: " + (this._seq++) + "\r\n" +
                   "Transport: RTP/AVP;unicast;client_port=" +  + "\r\n" +
                   "Date: " + new Date() + "\r\n" +
                   "\r\n");
    this._status(
  }
};

var pc;
var rtsp;
function fail(err) {
  console.error(err);
}

function initPeerConnectionWithSdp(sdp) {
  console.log("SDP: " + sdp);
  pc = new mozRTCPeerConnection();
  navigator.mozGetUserMedia({audio: true, fake:true}, function(s) {
    pc.addStream(s);
    pc.createOffer(function (ans) {
      console.log("answer: " + JSON.stringify(ans.sdp));
    }, fail);
  }, fail);
};

$(document).ready(function() {
  c.log('1');
  rtsp = new testrtsp('74.125.214.50', 554);
});
