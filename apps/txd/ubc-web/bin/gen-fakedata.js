const fs = require('fs');
const path = require('path');

function getImageDataList(folderName) {
  const images = fs.readdirSync(`${__dirname}/../public/data/${folderName}`);
  return images.map(f => {
    const ext = path.extname(f);
    const name = path.basename(f);
    return {
      path: `data/${folderName}/${name}`,
      name: path.basename(name, ext)
    }
  });
}

const json = {
  business: getImageDataList('business'),
  poster: getImageDataList('poster'),
  gallery: getImageDataList('gallery'),
}

fs.writeFileSync(`${__dirname}/../src/services/fake.json`, JSON.stringify(json, null, 2));