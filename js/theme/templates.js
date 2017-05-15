/**
 * @author ps / @___paul
 */

'use strict';

const nunjucks = require("nunjucks/browser/nunjucks-slim");
const settings = window.LB.settings;

const defaultTemplates = {
  post: require("Templates/template-post.html"),
  timeline: require("Templates/template-timeline.html"),
  itemImage: require("Templates/template-item-image.html"),
  itemEmbed: require("Templates/template-item-embed.html")
};

function getCustomTemplates() {
  let customTemplates = settings.customTemplates
    , mergedTemplates = defaultTemplates;

  for (let template in customTemplates) {
    let customTemplateName = customTemplates[template];
    defaultTemplates[template] = (ctx, cb) => {
      nunjucks.render(customTemplateName, ctx, cb);
    };
  }

  return mergedTemplates;
}

module.exports = settings.customTemplates
  ? getCustomTemplates()
  : defaultTemplates;
