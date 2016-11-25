const path = require('path');

const Promise = require('bluebird');
const cheerio = require('cheerio');

const helpFs = require('app/help.fs');
const log = require('app/core.logger');
// const includers = require('./includers');

let Markconf;

// const configure = conf => {
const configure = conf => {
  Markconf = conf;
  log.trace('Template compiler recived a new Markconf configuration.');
};

const isComment = node => {
  if ({}.hasOwnProperty.call(node, 'type') === false) {
    return false;
  }

  return node.type === 'comment';
};

const getCommentIsMarkserv = node => {
  return node.data
    .slice(0, node.data.indexOf('|'))
    .replace(/\s+/g, '')
    .toLowerCase() === 'markserv';
};

const availableIncluder = includerName => {
  const plugin = Markconf.plugins.includers[includerName];

  if (typeof plugin === 'object' && typeof plugin.htmlCommentIncluder === 'function') {
    return plugin;
  }

  return false;
};

const unpackCommentData = node => {
  const parts = node.data.split('|');

  const data = {};

  if ({}.hasOwnProperty.call(parts, 1)) {
    data.includer = parts[1];
  }

  if ({}.hasOwnProperty.call(data, 'includer')) {
    data.plugin = availableIncluder(data.includer);
  }

  if ({}.hasOwnProperty.call(parts, 2)) {
    data.filename = path.basename(parts[2]);
    data.dirname = path.dirname(parts[2]);
  }

  if ({}.hasOwnProperty.call(parts, 3)) {
    data.params = parts[3];
  }

  return data;
};

const compileTemplate = (templateFilepath, modifier, include, node) => {
  let $DOM;

  const processNode = (node, include, dir) => {
    return new Promise((resolve, reject) => {
      let filepath;

      if ({}.hasOwnProperty.call(include, 'dirname') &&
          {}.hasOwnProperty.call(include, 'filename')) {
        filepath = path.join(dir, include.dirname, include.filename);
      } else {
        filepath = false;
      }

      if (filepath) {
        // orig working ver.
        module.exports.compileTemplate(filepath, modifier, include).then(content => {
          const $content = cheerio.load(content)._root;
          $DOM(node).replaceWith($content);
          resolve(node);
        }).catch(err => {
          reject(err);
        });
      } else if (include.includer === '{modifier-template}') {
        const $content = cheerio.load(modifier.exports.modifierTemplate)._root;
        $DOM(node).replaceWith($content);
        resolve(node);
      }
    });
  };

  const filter = (node, dir, file) => {
    return new Promise((resolve, reject) => {
      if (typeof node !== 'object' || {}.hasOwnProperty.call(node, 'children') === false) {
        return resolve(node);
      }

      const promiseStack = [];

      node.childNodes.forEach(childNode => {
        const include = isComment(childNode) &&
          getCommentIsMarkserv(childNode) &&
          unpackCommentData(childNode, dir);

        if (include) {
          log.trace(`Markserv includer found in ${log.ul(file)} ...`);
          log.trace(log.hl(`<-- ${childNode.data} -->`));
          promiseStack.push(processNode(childNode, include, dir));
        } else {
          promiseStack.push(filter(childNode, dir, file));
        }
      });

      if (promiseStack.length === 0) {
        return resolve(node);
      }

      Promise.all(promiseStack).then(() => {
        resolve();
      }).catch(err => {
        reject(err);
      });
    });
  };

  return new Promise((resolve, reject) => {
    log.trace(`Compiling template from HTML file: ${log.ul(templateFilepath)}`);

    // dry these next for if blocks out...
    if (typeof include === 'undefined') {
      helpFs.readfile(templateFilepath)
      // includer.htmlCommentIncluder(templateFilepath, includer)
      .then(html => {
        $DOM = cheerio.load(html);

        const $rootElem = $DOM._root;
        const templateRoot = path.dirname(templateFilepath);

        filter($rootElem, templateRoot, templateFilepath).then(() => {
          const htmlOutput = $DOM.html();
          resolve(htmlOutput);
        }).catch(err => {
          log.error(err);
          reject(err);
        });
      })
      .catch(err => {
        reject(err);
      });
    }

    if (typeof include === 'object') {
      if (include.plugin) {
        include.plugin.htmlCommentIncluder(templateFilepath, include, node)
        .then(html => {
          $DOM = cheerio.load(html);

          const $rootElem = $DOM._root;
          const templateRoot = path.dirname(templateFilepath);

          filter($rootElem, templateRoot, templateFilepath).then(() => {
            const htmlOutput = $DOM.html();
            resolve(htmlOutput);
          }).catch(err => {
            log.error(err);
            reject(err);
          });
        })
        .catch(err => {
          reject(err);
        });
      } else {
        resolve('');
      }
    }

    if (typeof include === 'string') {
      $DOM = cheerio.load(include);

      const $rootElem = $DOM._root;
      const templateRoot = path.dirname(templateFilepath);

      filter($rootElem, templateRoot, templateFilepath).then(() => {
        const htmlOutput = $DOM.html();
        resolve(htmlOutput);
      }).catch(err => {
        log.error(err);
        reject(err);
      });
    }
  });
};

module.exports = {
  configure,
  compileTemplate
};
