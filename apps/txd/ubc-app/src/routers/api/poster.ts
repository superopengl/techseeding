import * as express from 'express';
import * as _ from 'lodash';
import * as httpAssert from 'http-assert';
import { PictureController } from '../../controllers/PictureController';
import { Picture } from '../../entity/Picture';
import { PosterController } from '../../controllers/PosterController';
import { Poster } from '../../entity/Poster';

export const pictureRouter = express.Router();

pictureRouter.get('/', async (req, res) => {
  const controller = new PosterController();
  const posters = controller.list();
  res.send(posters);
});

pictureRouter.get('/:id', async (req, res) => {
  const {id} = req.params;
  const controller = new PosterController();
  const poster = controller.get(id);
  httpAssert(poster, 404);
  res.send(poster);
});

pictureRouter.post('/', async (req, res) => {
  const poster: Poster = req.body;
  const controller = new PosterController();
  controller.create(poster);
  res.sendStatus(200);
});

pictureRouter.put('/', async (req, res) => {
  const poster: Poster = req.body;
  const controller = new PosterController();
  controller.update(poster);
  res.sendStatus(200);
});

pictureRouter.delete('/:id', async (req, res) => {
  const {id} = req.params;
  const controller = new PosterController();
  controller.delete(id);
  res.sendStatus(200);
});

export default pictureRouter;