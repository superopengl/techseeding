import apiRouter from './routers/api';

import * as express from 'express';
import * as compression from 'compression';
import { Request, Response } from 'express';
import * as bodyParser from 'body-parser';
import * as listEndpoints from 'express-list-endpoints';
import * as cors from 'cors';
import * as fileUpload from 'express-fileupload';

// create and setup express app
export function createAppInstance(httpsPort) {
  const app = express();
  app.use(fileUpload({
    createParentPath: true
}));
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.all('*', (req, res, next) => {
    if (req.secure) {
      return next();
    }
    res.redirect(`https://${req.hostname}${httpsPort === 443 ? '' : `:${httpsPort}`}${req.url}`);
  });
  app.use('/api', apiRouter);
  app.get('/healthcheck', (req, res) => res.send('OK'));
  app.get('/routelist', (req, res) => res.send(listEndpoints(app)));
  app.use('/', express.static(__dirname + '/../www'));
  app.get('*', (req, res) => res.sendFile('index.html', {root: './www'}));
  app.use(compression({ filter: (req, res) => !req.headers['x-no-compression'] && compression.filter(req, res) }));

  console.log(listEndpoints(app));

  return app;
}

