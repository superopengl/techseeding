import * as express from 'express';
import * as _ from 'lodash';
import * as httpAssert from 'http-assert';
import { PictureController } from '../../controllers/PictureController';
import { Picture } from '../../entity/Picture';

export const pictureRouter = express.Router();

pictureRouter.get('/:id', async (req, res) => {
  const id = req.params.id;
  const controller = new PictureController();
  const picture = controller.get(id);
  httpAssert(picture, 404);
  res.send(picture);
});

pictureRouter.post('/', async (req, res) => {
  const picture: Picture = req.body;
  const controller = new PictureController();
  controller.create(picture);
});

export default pictureRouter;