import * as express from 'express';
import { Request, Response } from 'express';
import * as bodyParser from  'body-parser';

// create and setup express app
const app = express();
app.use(bodyParser.json());

// register routes

app.get('/users', function(req: Request, res: Response) {
    // here we will have logic to return all users
});

app.get('/users/:id', function(req: Request, res: Response) {
    // here we will have logic to return user by id
});

app.post('/users', function(req: Request, res: Response) {
    // here we will have logic to save a user
});

app.put('/users/:id', function(req: Request, res: Response) {
    // here we will have logic to update a user by a given user id
});

app.delete('/users/:id', function(req: Request, res: Response) {
    // here we will have logic to delete a user by a given user id
});

// start express server
const port = process.env.PORT || 443;
console.log(`Starting on ${port}`);
app.listen(port);