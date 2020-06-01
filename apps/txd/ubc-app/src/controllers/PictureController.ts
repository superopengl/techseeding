import * as aws from 'aws-sdk';
import { createConnection, getRepository, getConnectionManager, Repository } from 'typeorm';
import { Picture } from '../entity/Picture';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

const S3_BUCKET = process.env.UBC_S3_BUCKET;
const AWS_SECRET_ACCESS_KEY = process.env.UBC_AWS_SECRET_ACCESS_KEY;
const AWS_ACCESS_KEY_ID = process.env.UBC_AWS_ACCESS_KEY_ID;
const AWS_REGION = process.env.UBC_AWS_REGION;

aws.config.update({
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  accessKeyId: AWS_ACCESS_KEY_ID,
  region: AWS_REGION
});

const s3 = new aws.S3();

export class PictureController {
  private repository: Repository<Picture>;

  constructor() {
    this.repository = getRepository(Picture);
  }

  async get(id: string) {
    return await this.repository.findOne(id);
  }

  async upload(file) {
    const id = uuidv4();
    const location = await uploadToS3(file, id);
    const picture: Picture = {
      id,
      fileName: id,
      mime: 'guess',
      location
    };
    return await this.repository.save(picture);
  }
}

// Upload your image to S3
async function uploadToS3(file, id): Promise<string> {
  const params = {
    Bucket: S3_BUCKET,
    Key: id,
    Body: file.data
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