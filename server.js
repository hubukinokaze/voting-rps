const express = require('express');
const bodyParser = require('body-parser');
const crypto = require("crypto");

const app = express();
const Pusher = require('pusher');


// START HEROKU
const path = require('path');

// to serve our JavaScript, CSS and index.html
app.use(express.static('./dist/'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

// END HEROKU

// CORS
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

const pusher = new Pusher({
  appId: '716553',
  key: '94c056c5d4985cdffc49',
  secret: '8af26c844bf2d2e57796',
  cluster: 'us2',
  useTLS: true
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/pusher/auth', function(req, res) {
  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;
  const presenceData = {
    user_id: crypto.randomBytes(16).toString("hex")
  };
  const auth = pusher.authenticate(socketId, channel, presenceData);
  res.send(auth);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Listening at http://localhost:', port));
