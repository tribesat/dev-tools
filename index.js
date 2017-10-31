/**
 *
 */
var payloadSerialOut = document.getElementById('payload-serial-output')
var modemSerialOut = document.getElementById('modem-serial-output')
var payloadPre = document.getElementById('payload-pre');
var modemPre = document.getElementById('modem-pre');
var uploadForm = document.getElementById('upload-form');
var fileInput = document.getElementById('file-input');
var payloadRadio = document.getElementById('payload-radio');
var modemRadio = document.getElementById('modem-radio');

const socket = io()

socket.on('payload-log', log => {
  payloadSerialOut.innerHTML += log;
  payloadPre.scrollTop = payloadSerialOut.scrollHeight;
});

socket.on('modem-log', log => {
  modemSerialOut.innerHTML += log;
  modemPre.scrollTop = modemSerialOut.scrollHeight;
});

uploadForm.onsubmit = e => {
  e.preventDefault();
  var data = new FormData();
  data.append('firmware', fileInput.files[0]);
  data.append('device', payloadRadio.checked ? 'payload' : 'modem');
  fetch('/firmware', {
    method: 'POST',
    body: data,
  })
    .then(res => res.json())
    .then(data => {
      console.log(data);
    })
    .catch(err => console.log);
};
