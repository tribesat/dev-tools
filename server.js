/**
 *
 */

const { exec } = require('child_process');
const SerialPort = require('serialport');
const process = require('process');
const path = require('path');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const multer = require('multer');

const upload = multer({ dest: '/tmp/' });

const PORT = 5000;
const PAYLOAD = 'PAYLOAD';
const MODEM = 'MODEM';
const PAYLOAD_PORT = process.argv[2];
const MODEM_PORT = process.argv[3];

// server

/**
 * Serve static files
 */
app.use(express.static('.'));

/**
 * Firmware upload endpoint
 */
app.post('/firmware', upload.single('firmware'), (req, res) => {
  const { filename } = req.file;
  const { device } = req.body;
  flashFirmware(path.join('/tmp', filename), device)
    .then(({ stdout, stderr }) => {
      res.json({ stdout, stderr });
    })
    .catch(err => {
      res.error({ error: err })
    });
});

io.on('connection', socket => {
  console.log('new client');
});

http.listen(PORT, function(){
  console.log('listening on *:' + PORT);
});

// serial comms

let payloadPort = new SerialPort(PAYLOAD_PORT, { baudRate: 57600, });
let modemPort = new SerialPort(MODEM_PORT, { baudRate: 57600, });

payloadPort.on('data', data => {
  io.sockets.emit('payload-log', data.toString());
});

modemPort.on('data', data => {
  io.sockets.emit('modem-log', data.toString());
});

// flashing
function flashFirmware(filename, device) {
  return new Promise((resolve, reject) => {
    payloadPort.close(err => {
      if (err)
        return reject(err);

      filename = '/var/folders/ph/nzyskt3x6h7fvz00ry339k0c0000gn/T/arduino_build_771952/Payload.ino.hex'

      const cmd = `avrdude ` +
        `-vvv ` +
        `-patmega328p ` +
        `-carduino ` +
        `-P${device === PAYLOAD ? PAYLOAD_PORT : MODEM_PORT} ` +
        `-b115200 ` +
        `-D ` +
        `-Uflash:w:${filename}:i`;

      exec(cmd, (err, stdout, stderr) => {
        if (err) {
          return reject(err);
        }
        console.log(stdout);
        console.log(stderr);

        // reopen the serial connection after flashing
        payloadPort = new SerialPort(PAYLOAD_PORT, { baudRate: 57600, });
        payloadPort.on('data', data => {
          io.sockets.emit('payload-log', data.toString());
        });
        resolve({ stdout, stderr });
      });
    });

  });
}
