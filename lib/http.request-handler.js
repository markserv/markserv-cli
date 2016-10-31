const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
// const minimatch = require('minimatch');
const log = require('./core.logger');

let Markconf;

const configure = conf => {
  log.trace('Received new configuration.');
  Markconf = conf;
  return Markconf;
};

const hasMarkdownExt = requestPath => {
  const extensions = Markconf.defaults.fileTypes.markdown;
  for (const ext of extensions) {
    if (path.extname(requestPath).toLowerCase() === ext.toLowerCase()) {
      return true;
    }
  }
  return false;
};

const isDirectory = requestPath => {
  const stat = fs.statSync(requestPath);
  const isDir = stat.isDirectory();
  return isDir;
};

// The reponse that gets written back to the browser
// payload = {statusCode, contentType, data}
const httpRespond = (payload, res) => {
  res.writeHead(payload.statusCode, {
    'Content-Type': payload.contentType
  });

  res.write(payload.data);
  res.end();
};

const handle = (type, requestPath, res) => {
  Markconf.plugins.modifiers.core[type].httpResponseModifier(requestPath)
  .then(payload => {
    httpRespond(payload, res);
  });
};

// The incomming request from the browser (req, res, next)
const handleRequest = (req, res) => {
  const requestPath = Markconf.root + req.originalUrl;
  log.info('Request: ' + chalk.white.underline(requestPath));

  const core = Markconf.plugins.modifiers.core;

  if (hasMarkdownExt(requestPath)) {
    if (core.markdown) {
      handle('markdown', requestPath, res);
      return;
    }

    log.info('No ' + log.hl('markdown') + ' modifier loaded to modifier core.');
  }

  if (isDirectory(requestPath)) {
    if (core.directory) {
      handle('directory', requestPath, res);
      return;
    }

    log.info('No ' + log.hl('directory') + ' modifier loaded to modifier core.');
  }
};

module.exports = {
  configure,
  handleRequest
};

