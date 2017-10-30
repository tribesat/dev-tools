/**
 *
 */

const SerialPort = require('serialport');
const process = require('process');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const multer = require('multer');

const upload = multer({ dest: '/tmp/' });

const PORT = 5000;
const PAYLOAD_PORT = process.argv[2];
const MODEM_PORT = process.argv[3];

// set up HTTP sockets
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/firmware', upload.single('firmware'), (req, res) => {
  console.log(req.file);
  res.send({ message: 'ok' });
});

io.on('connection', socket => {
  console.log('new client');
});

http.listen(PORT, function(){
  console.log('listening on *:' + PORT);
});

// setup serial comms
const payloadPort = new SerialPort(PAYLOAD_PORT, { baudRate: 57600, });
const modemPort = new SerialPort(MODEM_PORT, { baudRate: 57600, });

payloadPort.on('data', data => {
  io.sockets.emit('payload-log', data.toString());
});

modemPort.on('data', data => {
  io.sockets.emit('modem-log', data.toString());
});

