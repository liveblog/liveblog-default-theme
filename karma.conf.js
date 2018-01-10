// Karma configuration
// Generated on Fri Jan 05 2018 14:57:25 GMT+0100 (CET)

// --------------- nunjucks conf -----------------------
const nunjucksify = require('nunjucksify');
const nunjucks = require( 'nunjucks' );
const dateFilter = require('nunjucks-date-filter');

const nunjucksEnv = new nunjucks.Environment();

dateFilter.setDefaultFormat('dddd, MMMM Do, YYYY, h:MM:ss A');
nunjucksEnv.addFilter('date', dateFilter);

// ampify filter used by AMP theme
const ampifyFilter = (html) => {
  if (html.search(/iframe/i) > 0) {
    // html contains iframe
    const src = (/src=\"([^\"]+)\"/).exec(html)[1];
    var width = (/width=\"([^\"]+)\"/).exec(html)[1];
    var height = (/height=\"([^\"]+)\"/).exec(html)[1];

    if (!width || width.search("%") >= 0) {
      width = '350';
    }

    if (!height) {
      height = '350';
    }

    return `
    <amp-iframe
        width=${width}
        height=${height}
        layout="responsive"
        frameborder="0"
        sandbox="allow-scripts
        allow-same-origin allow-popups"
        src="${src}">
            <p placeholder>Loading...</p>
    </amp-iframe>`;
  }
  return html;
};

nunjucksEnv.addFilter('ampify', ampifyFilter);

// add addten filter used by AMP theme
var addtenFilter = function( dateString ) {
  var year = dateString.substring(0,4);
  var rest = dateString.substring(4);
  var newYear = parseInt(year) + 10;
  return newYear + rest;
};
nunjucksEnv.addFilter('addten', addtenFilter);

// nunjucksEnv.addGlobal('window.LB', {})

// -------------------- nunjucks conf end

var rewriteFilenames = function(filename) {
  var parts = filename.split("/");
  return parts[parts.length - 1];
  //return filename;
};

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: [ 'browserify', 'mocha', 'chai', 'sinon'],


    // list of files / patterns to load in the browser
    files: [
      'test/**/*.spec.js'
    ],


    // list of files / patterns to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'js/**/*.js': [ 'browserify' ]
    },


    browserify: {
      debug: true,
      transform: [
        ['babelify',  {presets: ["es2015"]}], 
        [nunjucksify, { extension: '.html', nameFunction: rewriteFilenames}]
      ]
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
