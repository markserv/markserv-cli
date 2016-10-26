// const fs = require('fs');
const path = require('path');
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

// The reponse that gets written back to the browser
// payload = {statusCode, contentType, data}
const httpRespond = (payload, res) => {
  console.log(payload);

  res.writeHead(payload.statusCode, {
    'Content-Type': payload.contentType
  });

  res.write(payload.data);
  res.end();

  return payload;
};

// The incomming request from the browser (req, res, next)
const handleRequest = (req, res) => {
  const requestPath = Markconf.path + req.originalUrl;

  const isMarkdownFile = hasMarkdownExt(requestPath);

  if (isMarkdownFile && Markconf.modifiers.core.markdown) {
    Markconf.modifiers.core.markdown.httpResponseModifier(requestPath)
    .then(modifiedResponse => {
      httpRespond(modifiedResponse, res);
    });
  }
};

module.exports = {
  configure,
  handleRequest
};

