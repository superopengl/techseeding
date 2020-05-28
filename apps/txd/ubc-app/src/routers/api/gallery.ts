import * as express from 'express';
import { Request, Response } from 'express';
import * as _ from 'lodash';
import * as httpAssert from 'http-assert';

export const galleryRouter = express.Router();

galleryRouter.get('/:id', async (req, res) => {
  res.send(req);
});

/**
 * Upload image
 */
galleryRouter.post('/:imangeId', async (req: Request, res: Response) => {
  const image = _.get(req, 'files.image');
  httpAssert(image, 400, 'No file uploaded');

  // Use the mv() method to place the file in upload directory (i.e. "uploads")
  image.mv('./uploads/' + image.name);

  const data = {
    name: image.name,
    mimetype: image.mimetype,
    size: image.size
  };
});

export default galleryRouter;