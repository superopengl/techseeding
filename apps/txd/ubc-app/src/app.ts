import * as express from 'express';
import * as compression from 'compression';
import { Request, Response } from 'express';
import * as bodyParser from 'body-parser';
import * as listEndpoints from 'express-list-endpoints';
import * as cors from 'cors';
import * as fileUpload from 'express-fileupload';
import * as YAML from 'yamljs';
import { connector } from 'swagger-routes-express';
import * as api from './api';

function connectSwaggerRoutes(app, ymlFile) {
  const apiDefinition = YAML.load(ymlFile);
  const connect = connector(api, apiDefinition);
  connect(app);
  return app;
}

// create and setup express app
export function createAppInstance(httpsPort) {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }
    res.status(500);
    res.json({ error: err });
  });
  app.use(fileUpload({
    createParentPath: true
  }));

  // Redirect HTTP to HTTPS
  app.all('*', (req, res, next) => {
    if (req.secure) {
      return next();
    }
    res.redirect(`https://${req.hostname}${httpsPort === 443 ? '' : `:${httpsPort}`}${req.url}`);
  });

  // Connect to /api/v*/ with the swagger file
  connectSwaggerRoutes(app, `${__dirname}/_assets/api.yml`);

  app.get('/healthcheck', (req, res) => res.send(JSON.stringify(process.env, undefined, 2)));
  app.get('/routelist', (req, res) => res.send(listEndpoints(app)));
  app.use('/', express.static(`${__dirname}/www`));

  // Debounce to frontend routing
  app.get('*', (req, res) => res.sendFile(`${__dirname}/www/index.html`));
  app.use(compression({ filter: (req, res) => !req.headers['x-no-compression'] && compression.filter(req, res) }));

  console.log(listEndpoints(app));

  return app;
}

