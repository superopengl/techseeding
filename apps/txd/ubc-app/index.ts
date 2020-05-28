import { createAppInstance } from './src/app';
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';

const httpPort = 80;
const httpsPort = +process.env.NODE_PORT || +process.env.UBC_PORT || 443;

const app = createAppInstance(httpsPort);
// start https server
const sslOptions = {
  key: fs.readFileSync(__dirname + '/keys/localhost.key', 'utf8'),
  cert: fs.readFileSync(__dirname + '/keys/localhost.crt', 'utf8')
};

console.log(`Starting on ${httpsPort}`);

http.createServer(app).listen(httpPort);
https.createServer(sslOptions, app).listen(httpsPort);