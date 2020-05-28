import { createAppInstance } from './src/app';
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import './src/services/repository';
import { connectDatabase } from './src/db';

async function launchApp() {
  await connectDatabase();

  const httpPort = 80;
  const httpsPort = +process.env.NODE_PORT || +process.env.UBC_PORT || 443;

  const app = createAppInstance(httpsPort);
  // start https server
  const sslOptions = {
    key: fs.readFileSync(__dirname + '/keys/localhost.key', 'utf8'),
    cert: fs.readFileSync(__dirname + '/keys/localhost.crt', 'utf8')
  };

  http.createServer(app).listen(httpPort);
  https.createServer(sslOptions, app).listen(httpsPort);

  console.log(`Starting on ${httpsPort}`);
}

launchApp();