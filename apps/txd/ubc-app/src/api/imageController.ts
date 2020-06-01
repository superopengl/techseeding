
import * as aws from 'aws-sdk';
import { createConnection, getRepository, getConnectionManager, Repository } from 'typeorm';
import { Picture } from '../entity/Picture';
import { assert } from '../utils';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config();

export async function getImage(req, res) {
  const { imageId } = req.params;
  const repo = getRepository(Picture);
  const image = repo.findOne(imageId);
  assert(image, 404);
  res.json(image);
}

const S3_BUCKET = process.env.UBC_S3_BUCKET;
const IMAGE_PREFIX = process.env.UBC_IMAGE_PREFIX;
const AWS_ACCESS_KEY_ID = process.env.UBC_AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.UBC_AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.UBC_AWS_REGION;

aws.config.update({
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  accessKeyId: AWS_ACCESS_KEY_ID,
  region: AWS_REGION
});

const s3 = new aws.S3();

// Upload your image to S3
async function uploadToS3(id, data): Promise<string> {
  assert(IMAGE_PREFIX && id, 404, 'image path cannot be composed');

  const params = {
    Bucket: S3_BUCKET,
    Key: `${IMAGE_PREFIX}/${id}`,
    Body: data
  };

  return new Promise((res, rej) => {
    s3.createBucket(() => {
      s3.upload(params, (err, data) => {
        if (err) {
          rej(err);
          return;
        }
        // return the S3's path to the image
        res(data.Location);
      });
    });
  });
}

export async function uploadImage(req, res) {
  const { file } = req.files;
  assert(file, 404, 'No file uploaded');
  const { name, data, mimetype, md5 } = file;

  const imageId = uuidv4();
  const location = await uploadToS3(imageId, data);

  const picture: Picture = {
    fileName: name,
    mime: mimetype,
    location,
    md5
  };

  const repo = getRepository(Picture);
  await repo.insert(picture);

  res.json(picture);
}