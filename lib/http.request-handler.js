const fs = require('fs');
const path = require('path');
// const minimatch = require('minimatch');
const log = require('./core.logger');
const helpFs = require('./help.fs');

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
  try {
    const stat = fs.statSync(requestPath);
    const isDir = stat.isDirectory();
    return isDir;
  } catch (err) {
    return false;
  }
};

// The reponse that gets written back to the browser
// payload = {statusCode, contentType, data}
const httpRespond = (payload, res, req) => {
  res.writeHead(payload.statusCode, {
    'Content-Type': payload.contentType
  });

  res.write(payload.data);

  const responseUrl = Markconf.url + req.originalUrl;
  // const responseCode = payload.statusCode > 399 ? log.red(payload.statusCode) : log.hl(payload.statusCode);

  res.end(() => {
    let responseLog;

    if (payload.statusCode > 399) {
      responseLog = log.red('Response: ') + log.ul(log.red(responseUrl)) + ' ' + log.red(payload.statusCode);
    } else {
      responseLog = log.ok('Response: ') + log.ul(responseUrl) + ' ' + log.hl(payload.statusCode);
    }

    log.info(responseLog);
  });
};

const handle = (type, requestPath, res, req) => {
  Markconf.plugins.modifiers.core[type].httpResponseModifier(requestPath, res, req)
  .then(payload => {
    httpRespond(payload, res, req);
  });
};

// The incomming request from the browser (req, res, next)
const handleRequest = (req, res) => {
  const requestPath = Markconf.root + req.originalUrl;
  log.info('Request: ' + log.ul(requestPath));

  const core = Markconf.plugins.modifiers.core;

  const directoryExists = isDirectory(requestPath);
  const fileExists = helpFs.fileExistsSync(requestPath);

  if (hasMarkdownExt(requestPath)) {
    if (core.markdown) {
      handle('markdown', requestPath, res, req);
      return;
    }
    log.info('No ' + log.hl('markdown') + ' modifier loaded into the modifier core.');
  }

  if (directoryExists) {
    if (core.directory) {
      handle('directory', requestPath, res, req);
      return;
    }
    log.info('No ' + log.hl('directory') + ' modifier loaded into the modifier core.');
  }

  if (fileExists) {
    if (core.file) {
      handle('file', requestPath, res, req);
      return;
    }
    log.info('No ' + log.hl('directory') + ' modifier loaded into the modifier core.');
  }

  if (directoryExists === false && fileExists === false) {
    if (core.http404) {
      handle('http404', requestPath, res, req);
      return;
    }
    log.info('No ' + log.hl('http404') + ' modifier loaded into the modifier core.');
  }
};

module.exports = {
  configure,
  handleRequest
};

