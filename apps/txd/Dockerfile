FROM node:12

WORKDIR /usr/app/ubc-portal
COPY ./ubc-app/build .

COPY ./ubc-app/package.json .
COPY ./ubc-app/package-lock.json .
RUN npm ci

CMD node index.js

EXPOSE 80 443

ENV NODE_ENV                    prod

ENV TYPEORM_HOST                localhost
ENV TYPEORM_USERNAME            postgres
ENV TYPEORM_PASSWORD            postgres
ENV TYPEORM_DATABASE            ubc
ENV TYPEORM_PORT                5432
ENV TYPEORM_ENTITIES            src/entity/*.js
ENV TYPEORM_LOGGING             false
ENV TYPEORM_SYNCHRONIZE         true

ENV UBC_AWS_ACCESS_KEY_ID       REDACTED
ENV UBC_AWS_SECRET_ACCESS_KEY   REDACTED
ENV UBC_AWS_REGION              ap-southeast-2
ENV UBC_IMAGE_PREFIX            prod
ENV UBC_S3_BUCKET               ubc-uploading-image

ENV UBC_HTTP_PORT               80
ENV UBC_HTTPS_PORT              443