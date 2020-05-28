import * as express from 'express';
import { Request, Response } from 'express';
import * as bodyParser from  'body-parser';

// create and setup express app
export const apiRouter = express.Router();
// register routes

apiRouter.get('/users', function(req: Request, res: Response) {
    // here we will have logic to return all users
});

apiRouter.get('/users/:id', function(req: Request, res: Response) {
    // here we will have logic to return user by id
});

apiRouter.post('/users', function(req: Request, res: Response) {
    // here we will have logic to save a user
});

apiRouter.put('/users/:id', function(req: Request, res: Response) {
    // here we will have logic to update a user by a given user id
});

apiRouter.delete('/users/:id', function(req: Request, res: Response) {
    // here we will have logic to delete a user by a given user id
});

export default apiRouter;