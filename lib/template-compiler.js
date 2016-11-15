const path = require('path');

const Promise = require('bluebird');
const cheerio = require('cheerio');

const fs = require('./help.fs');
const log = require('./core.logger');

let Markconf;

const configure = conf => {
  Markconf = conf;
  log.trace('Template compiler recived a new Markconf configuration.');
};

const loadTemplate = templatePath => {
  return new Promise((resolve, reject) => {
    fs.readfile(templatePath)
      .then(html => {
        resolve(html);
      })
      .catch(err => {
        reject(err);
      });
  });
};

const compileTemplate = templatePath => {
  return new Promise((resolve, reject) => {
    loadTemplate(templatePath)
    .then(html => {
      resolve(html);
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
