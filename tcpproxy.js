var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    net = require('net');

app.use(express.static(__dirname + "/static"));
app.use(express.logger());

io.sockets.on('connection', function (socket) {
  socket.emit('hello');
  socket.on('connect', function (data) {
    var connect = net.connect(data.port, data.host, function () {
      socket.emit('connect-result', { ok: true });
      socket.on('send', function(data) {
        connect.write(data.data);
      });
      connect.on('data', function(data) {
        socket.emit('recv', { data: data.toString('utf8') });
      });
      connect.on('close', function() {
        socket.close();
      });
      socket.on('close', function() {
        connect.close();
      });
    });
  });
});

server.listen(8000);

