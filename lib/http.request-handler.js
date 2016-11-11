const fs = require('fs');
const path = require('path');
const minimatch = require('minimatch');
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

const isFile = requestPath => {
  try {
    const stat = fs.statSync(requestPath);
    const isAFile = stat.isFile();
    return isAFile;
  } catch (err) {
    return false;
  }
};

// The reponse that gets written back to the browser
// payload = {statusCode, contentType, data}
const httpRespond = (payload, res, req, type) => {
  // Sometimes plugin handles write to browser, if so,payloads is null
  if (payload) {
    res.writeHead(payload.statusCode, {
      'Content-Type': payload.contentType
    });
    res.write(payload.data);
    res.end();
  }

  let responseLog;
  const responseUrl = Markconf.url + req.originalUrl;
  responseLog = log.ok('Response: ') + log.hl(type + ': ') + log.ul(responseUrl);

  if (payload) {
    responseLog += ' ' + log.hl(payload.statusCode);
  }

  if (payload && payload.statusCode > 399) {
    responseLog = log.red('Response: ') + log.hl(type + ': ') + log.ul(log.red(responseUrl)) + ' ' + log.red(payload.statusCode);
  }

  log.info(responseLog);
};

const handle = (pattern, requestPath, res, req) => {
  Markconf.plugins.modifiers[pattern].httpResponseModifier(requestPath, res, req)
  .then(payload => {
    httpRespond(payload, res, req, pattern);
  });
};

const getPathFromUrl = url => {
  return url.split(/[?#]/)[0];
};

const matchPath = url => {
  const patterns = Markconf.modifiers;
  for (const pattern in patterns) {
    if ({}.hasOwnProperty.call(patterns, pattern)) {
      const match = minimatch(url, pattern, {
        matchBase: true
      });

      if (match) {
        const module = patterns[pattern];

        return {
          module,
          pattern
        };
      }
    }
  }
  return false;
};

// The incomming request from the browser (req, res, next)
const handleRequest = (req, res, next) => {
  const rawUrl = req.originalUrl;
  const url = getPathFromUrl(rawUrl);
  const requestPath = path.resolve(path.join(Markconf.root, url));

  log.info('Request: ' + log.ul(requestPath));

  const matchingModule = matchPath(url);
  // const fileExists = helpFs.fileExistsSync(requestPath);
  const fileExists = isFile(requestPath);

  // console.log(requestPath, fileExists, helpFs.fileExistsSync(requestPath));

  if (fileExists && matchingModule.module) {
    handle(matchingModule.pattern, requestPath, res, req);
    return;
  }

  const directoryExists = isDirectory(requestPath);

  if (directoryExists && matchingModule.module) {
    handle(matchingModule.pattern, requestPath, res, req);
    return;
  }

  const matchingModuleSlashed = matchPath(url + '/');

  if (directoryExists && matchingModuleSlashed.module) {
    handle(matchingModuleSlashed.pattern, requestPath, res, req);
    return;
  }

  // if (!fileExists && typeof Markconf.modifiers['404'] === 'object') {
  //   handle('404', requestPath, res, req);
  //   return;
  // }

  // console.log('matchingModuleSlashed: ' + matchingModuleSlashed.pattern);

  // if (directoryExists && matchingModuleSlashed.module) {
  //   console.log('MATCH 22222!!');
  //   handle(matchingModuleSlashed.pattern, requestPath, res, req);
  //   return;
  // }

  // const matchingModule = matchPath(url);

  // rawUrl[rawUrl.length] !== '/') {
    // if
    // url = rawUrl + '/';
    // console.log(url);
    // if (matchPath(url) || matchParen());
    // handle(matchingModule.pattern, requestPath, res, req);
    // return;
  // }

  // Slice because we remove the "./" we added to the path to make sure the minimatch processes
  // the comparison relatively. Ok bad english. Sorry.

  // var matchingModuleLoaded = minimatch(req.originalUrl, module, { matchBase: true });
  // log.trace(req.originalUrl, module, matchingModuleLoaded);

  // if (hasMarkdownExt(requestPath)) {
  //   if (core.markdown) {
  //     handle('markdown', requestPath, res, req);
  //     return;
  //   }
  //   log.info('No ' + log.hl('markdown') + ' modifier loaded into the modifier core.');
  // }

  // if (directoryExists) {
  //   if (core.directory) {
  //     handle('directory', requestPath, res, req);
  //     return;
  //   }
  //   log.info('No ' + log.hl('directory') + ' modifier loaded into the modifier core.');
  // }

  // if (fileExists) {
  //   if (core.file) {
  //     handle('file', requestPath, res, req);
  //     return;
  //   }
  //   log.info('No ' + log.hl('directory') + ' modifier loaded into the modifier core.');
  // }

  // if (directoryExists === false && fileExists === false) {
  //   if (core.http404) {
  //     handle('http404', requestPath, res, req);
  //     return;
  //   }
  //   log.info('No ' + log.hl('http404') + ' modifier loaded into the modifier core.');
  // }
};

module.exports = {
  configure,
  handleRequest
};

