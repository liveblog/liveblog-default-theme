/**
 * @author ps / @___paul
 */

'use strict';

require("Less/liveblog.less");

// Prerender functions
var theme = require('./theme');

document.addEventListener('DOMContentLoaded', () => {
  theme.init();
});

module.exports = {};
