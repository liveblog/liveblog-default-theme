'use strict';

const path = require('path')
  , nunjucks = require('nunjucks');

const templatePath = [
    path.resolve(__dirname, '../node_modules/liveblog-default-theme/templates'),
    path.resolve(__dirname, '../templates')
  ]
  , nunjucksLoader = new nunjucks.FileSystemLoader(templatePath)
  , nunjucksEnv = new nunjucks.Environment(nunjucksLoader);

module.exports = {
  nunjucksEnv: nunjucksEnv
};
