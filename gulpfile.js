'use strict';

var gulp = require('gulp')
  , browserify = require('browserify')
  , nunjucksify = require('nunjucksify')
  , gulpLoadPlugins = require('gulp-load-plugins')
  , source = require('vinyl-source-stream')
  , buffer = require('vinyl-buffer')
  , plugins = gulpLoadPlugins()
  , del = require('del')
  , eslint = require('gulp-eslint')
  , fs = require('fs')
  , path = require('path')
  , nunjucks = require('nunjucks');

var DEBUG = process.env.NODE_ENV !== "production";
const inputPath = process.env.EXTENDED_MODE ? './node_modules/liveblog-default-theme/' : '';

let argvKey = 0,
  apiHost = '',
  blogId = '',
  protocol = '',
  apiResponse = {
    posts: {_items: []},
    stickyPosts: {_items: []}
  },
  match = [];

const http = require('http');
const https = require('https');

['--embedUrl', '--apiUrl'].forEach((argName) => {
  if (process.argv.indexOf(argName) !== -1) {
    argvKey = process.argv.indexOf(argName)+1;
  }
});

if (argvKey !== 0) {
  match = process.argv[argvKey]
    //.match(/^(http:\/\/|https:\/\/|\/\/)([^/]+)\/(api\/client_blogs|embed)\/(\w+)/i);
    .match(/^(http:\/\/|https:\/\/|\/\/)([^\/]+)\/(api\/client_blogs|embed|[^\/]+\/blogs)\/(\w+)/i);
}

if (match.length > 0) {
  [,protocol, apiHost,, blogId] = match;

  const postsEndpoint = `${protocol}${apiHost}/api/client_blogs/${blogId}/posts`;
  const request = protocol === 'http://' ? http : https;

  let query = {
    "query": {
      "filtered": {
        "filter": {
          "and": [
            {"term": {"sticky": true}},
            {"term": {"post_status": "open"}},
            {"not": {"term": {"deleted": true}}}
          ]
        }
      }
    },
    "sort": [
      {
        "_updated": {"order": "desc"}
      }
    ]
  };

  request.get(`${postsEndpoint}?source=${JSON.stringify(query)}`, (response) => {
    let body = '';

    response.on('data', (d) => {
      body += d;
    });
    response.on('end', () => {
      apiResponse.stickyPosts = JSON.parse(body);
    });
  });

  query.query.filtered.filter.and[0].term.sticky = false;

  request.get(`${postsEndpoint}?source=${JSON.stringify(query)}`, (response) => {
    let body = '';

    response.on('data', (d) => {
      body += d;
    });
    response.on('end', () => {
      apiResponse.posts = JSON.parse(body);
    });
  });
}

const templatePath = [
  path.resolve(__dirname, '../../templates'),
  path.resolve(__dirname, 'templates')
];

const nunjucksLoader = new nunjucks.FileSystemLoader(templatePath);
const nunjucksOptions = {env: new nunjucks.Environment(nunjucksLoader)};


var paths = {
  less: inputPath + 'less/*.less',
  js: [inputPath + 'js/*.js', inputPath + 'js/*/*.js'],
  jsfile: 'liveblog.js', // Browserify basedir
  cssfile: inputPath + 'liveblog.css',
  templates: inputPath + 'templates/*.html'
};

// Command-line and default theme options from theme.json.
var theme = require('./theme.json');

function getThemeSettings(options) {
  var _options = {};
  for (var option in options) {
    _options[option.name] = option.default;
  }
  return _options;
}


// Function to async reload default theme options.
function loadThemeJSON() {
  fs.readFile(inputPath + 'theme.json', 'utf8', (err, data) => {
    theme = JSON.parse(data);
  });
}

gulp.task('lint', () => gulp.src([inputPath + 'js/**/*.js',inputPath + 'gulpfile.js'])
  .pipe(eslint({ quiet: true }))
  .pipe(eslint.format())
  .pipe(eslint.failAfterError())
);

//gulp.task('move-templates', () => gulp.src(inputPath + 'templates/*.html')
//  .pipe(gulp.dest(inputPath + 'templates-dist')));

//gulp.task('move-subtemplates', ['move-templates'], () => gulp.src('./templates/*.html')
//  .pipe(gulp.dest(inputPath + 'templates-dist')));

// Browserify.
let browserifyPreviousTasks = ['clean-js'];

//if (process.env.EXTENDED_MODE) {
//  browserifyPreviousTasks.push('move-subtemplates');
//}

gulp.task('browserify', browserifyPreviousTasks, (cb) => {
  var b = browserify({
    basedir: inputPath,
    entries: 'js/liveblog.js',
    fullPaths: true,
    debug: DEBUG
  });

  var rewriteFilenames = function(filename) {
    var parts = filename.split("/");
    return parts[parts.length - 1];
    //return filename;
  };

  // Source-mapped
  return b
    .transform("babelify", {presets: ["es2015"]})
    .transform(nunjucksify, {
      extension: '.html',
      nameFunction: rewriteFilenames
    })
    .bundle()
    .on('error', plugins.util.log)
    .pipe(source(paths.jsfile))
    .pipe(buffer())
    .pipe(plugins.rev())
    .pipe(plugins.ngAnnotate())
    .pipe(plugins.if(!DEBUG, plugins.uglify()))
    .pipe(gulp.dest('./dist'))
    .pipe(plugins.rev.manifest('dist/rev-manifest.json', {merge: true}))
    .pipe(gulp.dest(''));
});

// Compile LESS files.
gulp.task('less', ['clean-css'], () => gulp.src(inputPath + 'less/liveblog.less')
  .pipe(plugins.less({
    paths: [path.join(__dirname, 'less', 'includes')]
  }))

  .pipe(plugins.if(!DEBUG, plugins.minifyCss({compatibility: 'ie8'})))
  .pipe(plugins.rev())
  .pipe(gulp.dest('./dist'))
  .pipe(plugins.rev.manifest('dist/rev-manifest.json', {merge: true}))
  .pipe(gulp.dest(''))
);

gulp.task('extend-less', ['less'], () => {
  var manifest = require("./dist/rev-manifest.json");

  gulp.src([`./dist/${manifest['liveblog.css']}`, './less/*.less'])
    .pipe(plugins.less({
      paths: [path.join(__dirname, 'less', 'includes')]
    }))

    .pipe(plugins.if(!DEBUG, plugins.minifyCss({compatibility: 'ie8'})))
    .pipe(plugins.rev())
    .pipe(plugins.concat(manifest['liveblog.css']))
    .pipe(gulp.dest('./dist'));
    //.pipe(plugins.rev.manifest('dist/rev-manifest.json', {merge: true}))
    //.pipe(gulp.dest(''))
} );

// Inject API response into template for dev/test purposes.
gulp.task('index-inject', ['less', 'browserify'], () => {
  var testdata = require('./test');
  var sources = gulp.src(['./dist/*.js', './dist/*.css'], {
    read: false // We're only after the file paths
  });

  if (apiResponse.posts._items.length > 0) {
    testdata.options.api_host = `${protocol}${apiHost}`;
    testdata.options.blog._id = blogId;
  }

  return gulp.src('./templates/template-index.html')
  //return gulp.src(inputPath + 'templates/template-index.html')
    .pipe(plugins.inject(sources))
    .pipe(plugins.nunjucks.compile({
      options: testdata.options,
      json_options: JSON.stringify(testdata.options, null, 4),
      settings: testdata.options.settings,
      api_response: apiResponse.posts._items.length > 0 ? apiResponse : testdata.api_response,
      include_js_options: true,
      debug: DEBUG
    }, apiResponse.posts._items.length > 0 ? {} : nunjucksOptions ))

    .pipe(plugins.rename("index.html"))
    .pipe(gulp.dest(''))
    .pipe(plugins.connect.reload());
});

// Inject jinja/nunjucks template for production use.
gulp.task('template-inject', ['less', 'browserify'], () => {
  var themeSettings = getThemeSettings(theme.options);

  return gulp.src('./templates/template.html')
    .pipe(plugins.nunjucks.compile({
      theme: theme,
      theme_json: JSON.stringify(theme, null, 4),
      settings: themeSettings,
      include_js_options: false,
      debug: DEBUG
    }))

    // Add nunjucks/jinja2 template for server-side processing.
    .pipe(plugins.inject(gulp.src([inputPath + 'templates-dist/template-timeline.html']), {
      starttag: '<!-- inject:template-content -->',
      transform: function(filepath, file) {
        return file.contents.toString();
      }
    }))

    // Save base template.html file.
    .pipe(plugins.rename("template.html"))
    .pipe(gulp.dest('.'))
    .pipe(plugins.connect.reload());
});

// Replace assets paths and version in theme.json file and reload options.
gulp.task('theme-replace', ['browserify', 'less'], () => {
  var manifest = require("./dist/rev-manifest.json");
  var base = './';

  gulp.src('theme.json', {base: base})
    .pipe(plugins.replace(/liveblog-.*\.css/g, manifest[paths.cssfile] || manifest['liveblog.css']))
    .pipe(plugins.replace(/liveblog-.*\.js/g, manifest[paths.jsfile]))
    .pipe(plugins.replace(/"version":\s*"(\d+\.\d+\.)(\d+)"/,(a, p, r) => `"version": "${p}${++r}"`))
    .pipe(gulp.dest(base));

  // Reload theme options
  loadThemeJSON();
});

// Serve index.html for local testing.
let servePreviousTasks = ['browserify', 'less', 'index-inject'];

if (process.env.EXTENDED_MODE) {
  servePreviousTasks.splice(2, 0, 'extend-less');
}

gulp.task('serve', servePreviousTasks, () => {
  plugins.connect.server({
    port: 8008,
    root: '.',
    fallback: 'index.html',
    livereload: true
  });
});

// Watch
gulp.task('watch-static', ['serve'], () => {
  var js = gulp.watch(paths.js, ['browserify', 'index-inject'])
    , less = gulp.watch(paths.less, ['less', 'index-inject'])
    , templates = gulp.watch(paths.templates, ['index-inject']);

  [js, less, templates].forEach((el, i) => {
    el.on('error', (e) => {
      console.error(e.toString());
    });
  });
});

// Clean CSS
gulp.task('clean-css', () => del(['dist/*.css']));

// Clean JS
gulp.task('clean-js', () => del(['dist/*.js']));

// Default build for production
if (process.env.EXTENDED_MODE) {
  gulp.task('default', ['browserify', 'less', 'extend-less', 'theme-replace', 'template-inject']);
} else {
  gulp.task('default', ['browserify', 'less', 'theme-replace', 'template-inject']);
}

// Default build for development
gulp.task('devel', ['browserify', 'less', 'theme-replace', 'index-inject']);

module.exports = gulp;
