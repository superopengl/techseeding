import { createAppInstance } from './app';
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { connectDatabase } from './db';
import * as dotenv from 'dotenv';

function loadEnv() {
  const env = (process.env.NODE_ENV || 'dev').toLowerCase();
  const isNonProd = env !== 'prod' && env !== 'production';
  if (isNonProd) {
    // non prod
    const envPath = path.resolve(process.cwd(), `.env.${env}`);
    console.log('Overriding env vars with', envPath);
    dotenv.config({ path: envPath });
  }

  dotenv.config();
  console.log('Environment variables');
  console.log(JSON.stringify(process.env, undefined, 2));
}

async function launchApp() {
  loadEnv();

  console.log('Connecting database');
  await connectDatabase();

  const httpPort = +process.env.UBC_HTTP_PORT || 80;
  const httpsPort = +process.env.UBC_HTTPS_PORT || 443;

  const app = createAppInstance(httpsPort);
  // start https server
  const sslOptions = {
    key: fs.readFileSync(`${__dirname}/_assets/keys/localhost.key`, 'utf8'),
    cert: fs.readFileSync(`${__dirname}/_assets/keys/localhost.crt`, 'utf8')
  };

  http.createServer(app).listen(httpPort);
  https.createServer(sslOptions, app).listen(httpsPort);

  console.log(`Starting on ${httpsPort}`);
}

launchApp();