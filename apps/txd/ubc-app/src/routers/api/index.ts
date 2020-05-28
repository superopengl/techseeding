import * as express from 'express';
import { Request, Response } from 'express';
import * as bodyParser from 'body-parser';
import pictureRouter from './picture';
import galleryRouter from './gallery';
import posterRouter from './poster';

// create and setup express app
export const apiRouter = express.Router();
// register routes

apiRouter.use('/image', pictureRouter);
apiRouter.use('/poster', posterRouter);
apiRouter.use('/business', pictureRouter);
apiRouter.use('/event', pictureRouter);
apiRouter.use('/gallery', galleryRouter);

export default apiRouter;

