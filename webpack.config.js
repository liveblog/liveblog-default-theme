const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
//const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: ['./js/liveblog.js'],
  output: {
    filename: 'liveblog.js',
    path: path.resolve(__dirname, 'dist')
  },
  resolve: {
    alias: {
      Less: path.resolve(__dirname, 'less/'),
      templates: path.resolve(__dirname, 'templates/')
    }
  },
  module: {
    loaders: [
      {
        test: /\.html$/,
        use: 'nunjucks-loader'
      },
      {
        test: /\.less$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: "css-loader!less-loader",
        }),
      },
      {
        test: /\.(png|gif|jpeg|jpg|woff|woff2|eot|ttf|svg)(\?.*$|$)/,
        use: 'file-loader'
      },
    ]
  },
  devServer: {
    inline: false,
    hot: true,
    // enable HMR on the server

    contentBase: path.resolve(__dirname, 'dist'),
    // match the output path

    publicPath: '/'
    // match the output `publicPath`
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new ExtractTextPlugin('liveblog.css'),
    //new HtmlWebpackPlugin({
    //  title: 'Custom template using Handlebars',
    //  template: 'templates/template-index.html'
    //})
  ]
};
