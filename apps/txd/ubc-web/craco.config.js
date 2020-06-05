const CracoLessPlugin = require('craco-less');

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: {
              '@primary-color': '#81a9de',
              '@font-size-base': '16px',
              '@height-base': '40px',
              '@height-lg': '48px',
              '@height-sm': '32px',
              '@border-radius-base': '4px',
            },
            javascriptEnabled: true,
          }
        }
      },
    },
  ],
};