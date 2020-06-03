export function getImageUrl(imageId, throws = false) {
  if(throws && !imageId) {
    throw new Error('imageId is not specified');
  }
  return imageId ? `${process.env.REACT_APP_UBC_S3_URL}/${imageId}` : undefined
}