import * as express from 'express';
import * as _ from 'lodash';
import * as httpAssert from 'http-assert';
import { PictureController } from '../../controllers/PictureController';
import { Picture } from '../../entity/Picture';
import { assert } from '../../utils/assert';

export const pictureRouter = express.Router();

pictureRouter.get('/:id', async (req, res) => {
  const id = req.params.id;
  const controller = new PictureController();
  const picture = controller.get(id);
  httpAssert(picture, 404);
  res.send(picture);
});

pictureRouter.post('/', async (req, res) => {
  const file = _.get(req, 'files.file');
  assert(file, 400, 'File not specified');
  try {
    const controller = new PictureController();
    const location = await controller.upload(file);
    res.json(location);
  } catch (err) {
    console.log(err.message);
    res.status(422).send(err);
  }
});

export default pictureRouter;