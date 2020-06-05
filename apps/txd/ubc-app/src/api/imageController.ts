
import * as aws from 'aws-sdk';
import { createConnection, getRepository, getConnectionManager, Repository } from 'typeorm';
import { Image } from '../entity/Image';
import { assert } from '../utils';
import { v4 as uuidv4 } from 'uuid';

export async function getImage(req, res) {
  const { id } = req.params;
  const repo = getRepository(Image);
  const image = repo.findOne(id);
  assert(image, 404);
  res.json(image);
}


function getS3Service() {
  aws.config.update({
    secretAccessKey: process.env.UBC_AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.UBC_AWS_ACCESS_KEY_ID,
    region: process.env.UBC_AWS_REGION
  });

  const s3 = new aws.S3();
  return s3;
}

// Upload your image to S3
async function uploadToS3(id, data): Promise<string> {
  const bucketName = process.env.UBC_S3_BUCKET;
  const prefix = process.env.UBC_IMAGE_PREFIX;

  assert(prefix && id, 404, `image path cannot be composed '${bucketName}/${prefix}/${id}'`);

  const params = {
    Bucket: bucketName,
    Key: `${prefix}/${id}`,
    Body: data
  };

  return new Promise((res, rej) => {
    const s3 = getS3Service();
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
  const { id } = req.params;
  assert(id, 404, 'Image ID not specified');
  const { file } = req.files;
  assert(file, 404, 'No file uploaded');
  const { name, data, mimetype, md5 } = file;

  const location = await uploadToS3(id, data);

  const image: Image = {
    id,
    fileName: name,
    mime: mimetype,
    location,
    md5
  };

  const repo = getRepository(Image);
  await repo.insert(image);

  res.json(image);
}