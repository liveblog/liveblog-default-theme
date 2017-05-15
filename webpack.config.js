const path = require('path');

module.exports = {
  entry: './js/liveblog.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  resolve: {
    alias: {
      Templates: path.resolve(__dirname, 'templates/')
    }
  },
  module: {
    loaders: [
      {
        test: /\.html$/,
        loader: 'nunjucks-loader'
      }
    ]
  }
};
