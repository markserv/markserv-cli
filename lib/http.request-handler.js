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

const isDirectory = requestPath => {
  try {
    const stat = fs.statSync(requestPath);
    const isDir = stat.isDirectory();
    return isDir;
  } catch (err) {
    return false;
  }
};

const logHttpResponse = (payload, req, type) => {
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

// The reponse that gets written back to the browser
// payload = {statusCode, contentType, data}
const httpRespond = (payload, res) => {
  // Sometimes plugin handles write to browser, if so,payloads is null
  if (payload) {
    res.writeHead(payload.statusCode, {
      'Content-Type': payload.contentType
    });
    res.write(payload.data);
    res.end();
  }
};

const handlerChainedModifiers = (modifierStack, requestPath, res, req) => {
  console.log('HC HC HC HC HC HC HC HC HC HC HC HC HC HC HC HC HC HC HC HC HC HC HC HC HC ');
  console.log(requestPath);

  return new Promise((resolve, reject) => {
    const modifierQueue = [];

    for (const modifier of modifierStack) {
      modifierQueue.push(modifier);
    }

    const newPromise = (modifier, lastPayload) => {
      return new Promise((resolve, reject) => {
        modifier.httpResponseModifier(requestPath, res, req, lastPayload)
        .then(nextPayload => {
          const nextModifier = modifierQueue.shift();

          if (nextModifier) {
            const nextPromise = newPromise(nextModifier, nextPayload);
            return resolve(nextPromise);
          }

          return resolve(nextPayload);
        })
        .catch(err => {
          reject(err);
        });
      });
    };

    const nextModifier = modifierQueue.shift();
    const nextPromise = newPromise(nextModifier);

    return resolve(nextPromise)
    .catch(err => {
      reject(err);
    });
  });
};

const handle = (pattern, requestPath, res, req) => {
  const modifier = Markconf.plugins.modifiers[pattern];
  const definitionType = Array.isArray(modifier) ? 'array' : 'object';

  // console.log(modifier);
  console.log('RP RP RP RP RP RP RP RP RP RP RP RP RP RP RP RP RP RP RP RP RP RP RP RP');
  console.log(requestPath);

  if (definitionType === 'object') {
    modifier.httpResponseModifier(requestPath, res, req)
    .then(payload => {
      httpRespond(payload, res, req);
      logHttpResponse(payload, req, pattern);
    }).catch(err => {
      log.error(err);
    });
  } else if (definitionType === 'array') {
    handlerChainedModifiers(modifier, requestPath, res, req)
    .then(payload => {
      httpRespond(payload, res, req);
      logHttpResponse(payload, req, pattern);
    }).catch(err => {
      log.error(err);
    });
  }
};

// const getPathFromUrl = url => {
//   return url.split(/[?#]/)[0];
// };

const matchPath = url => {
  const patterns = Markconf.plugins.modifiers;
  console.log(patterns);
  for (const pattern in patterns) {
    console.log(pattern);
  }

  for (const pattern in patterns) {
    if ({}.hasOwnProperty.call(patterns, pattern)) {
      const match = minimatch(url, pattern, {
        matchBase: true,
        dot: true
      });

      if (match) {
        const module = patterns[pattern];

        console.log(url, pattern, match);

        return {
          module,
          pattern
        };
      }
    }
  }

  return false;
};

const isLastCharInStr = (str, char) => {
  return str[str.length] === char;
};

// The incomming request from the browser (req, res, next)
const handleRequest = (req, res) => {
  console.log('///////////////////////////////////////////////////');

  const url = req.url;

  let requestPath = path.join(Markconf.root, url);

  const isDir = helpFs.directoryExistsSync(requestPath);

  // make sure slash is on the end of a dir path for minimatch
  if (isDir && isLastCharInStr(requestPath, '/') === false) {
    requestPath += '/';
  }

  log.info('Request: ' + log.ul(requestPath));

  const matchingModule = matchPath(requestPath);

  if (isDir && matchingModule.module) {
    handle(matchingModule.pattern, requestPath, res, req);
    return;
  }

  const isFile = helpFs.fileExistsSync(requestPath);

  if (isFile && matchingModule.module) {
    handle(matchingModule.pattern, requestPath, res, req);
    return;
  }

  if (!isFile && !isDir && {}.hasOwnProperty.call(Markconf.plugins.modifiers, 404)) {
    handle('404', requestPath, res, req);
    return;
  }

  log.warn(`No modifier found in Markconf to handle request: ${log.hl(requestPath)}`);
};

module.exports = {
  configure,
  handleRequest
};
