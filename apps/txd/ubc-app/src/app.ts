import apiRouter from './routers/apiRouter';

import * as express from 'express';
import * as compression from 'compression';
import { Request, Response } from 'express';
import * as bodyParser from 'body-parser';
import * as listEndpoints from 'express-list-endpoints';

// create and setup express app
export function createAppInstance(httpsPort) {
  const app = express();
  app.use(bodyParser.json());
  app.all('*', (req, res, next) => {
    if (req.secure) {
      return next();
    }
    res.redirect(`https://${req.hostname}${httpsPort === 443 ? '' : `:${httpsPort}`}${req.url}`);
  });
  app.get('/api', apiRouter);
  app.get('/healthcheck', (req, res) => res.send('OK'));
  app.get('/routelist', (req, res) => res.send(listEndpoints(app)));
  app.use('/', express.static('www'));
  app.use(compression({ filter: (req, res) => !req.headers['x-no-compression'] && compression.filter(req, res) }));

  console.log(listEndpoints(app));

  return app;
}

