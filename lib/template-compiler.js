const path = require('path');

const Promise = require('bluebird');
const cheerio = require('cheerio');

const helpFs = require('./help.fs');
const log = require('./core.logger');

let Markconf;

const configure = conf => {
  Markconf = conf;
  log.trace('Template compiler recived a new Markconf configuration.');
};

// const loadTemplate = templatePath => {
//   return new Promise((resolve, reject) => {
//     helpFs.readfile(templatePath)
//       .then(html => {
//         resolve(html);
//       })
//       .catch(err => {
//         reject(err);
//       });
//   });
// };

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
    .toLowerCase();
};

const unpackCommentData = node => {
  const parts = node.data.split('|');

  const data = {};

  data.includer = {}.hasOwnProperty.call(parts, 1) ? parts[1] : null;
  data.file = {}.hasOwnProperty.call(parts, 2) ? parts[2] : null;
  data.params = {}.hasOwnProperty.call(parts, 3) ? parts[3] : null;

  return data;
};

const compileTemplate = templateFilepath => {
  console.log('..........................................');
  console.log(templateFilepath);

  let $DOM;

  const processNode = (node, include) => {
    return new Promise((resolve, reject) => {
      helpFs.readfile(include.filepath).then(content => {

        const $content = cheerio.load(content)._root;
        $DOM(node).replaceWith($content);

        resolve();
      }).catch(err => {
        reject(err);
      });
    });
  };

  const filter = (node, dir) => {
    return new Promise((resolve, reject) => {
      log.trace('filtering dom node');

      if ({}.hasOwnProperty.call(node, 'children') === false) {
        log.trace('this dom node has no childeren');
        return resolve();
      }

      const promiseStack = [];

      node.childNodes.forEach(childNode => {
        const include = isComment(childNode) &&
          getCommentIsMarkserv(childNode) &&
          unpackCommentData(childNode);
        // console.log(include);

        if (include) {
          const filepath = path.join(dir, include.file);
          include.filepath = filepath;
          promiseStack.push(processNode(childNode, include));
        } else {
          promiseStack.push(filter(childNode, dir));
        }
      });

      if (promiseStack.length === 0) {
        log.trace('No promises created for this html.');
        return resolve();
      }

      Promise.all(promiseStack).then(() => {
        resolve();
      }).catch(err => {
        reject(err);
      });
    });
  };

  return new Promise((resolve, reject) => {
    helpFs.readfile(templateFilepath)
    .then(html => {
      $DOM = cheerio.load(html);

      const $rootElem = $DOM._root;
      const templateRoot = path.dirname(templateFilepath);

      filter($rootElem, templateRoot).then(() => {
        console.log('-------[ HTML OUTPUT ]--------');
        const htmlOutput = $DOM.html();
        console.log(htmlOutput);
        resolve(htmlOutput);
      }).catch(err => {
        reject(err);
      });
    })
    .catch(err => {
      reject(err);
    });
  });
};

module.exports = {
  configure,
  compileTemplate
};
