import * as express from 'express';
import { Request, Response } from 'express';
import * as bodyParser from  'body-parser';
import imageRouter from './image';
import galleryRouter from './gallery';

// create and setup express app
export const apiRouter = express.Router();
// register routes

apiRouter.use('/image', imageRouter);
apiRouter.use('/poster', imageRouter);
apiRouter.use('/business', imageRouter);
apiRouter.use('/event', imageRouter);
apiRouter.use('/gallery', galleryRouter);

export default apiRouter;