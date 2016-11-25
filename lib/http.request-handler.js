const fs = require('fs');
const path = require('path');

const minimatch = require('minimatch');

const log = require('app/core.logger');
const helpFs = require('app/help.fs');
const templateCompiler = require('app/template-compiler');

let Markconf;

const configure = conf => {
  log.trace('Received new configuration.');
  Markconf = conf;
  return Markconf;
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

const checkIncludes = (payload, props) => {
  return new Promise((resolve, reject) => {
    // Do not process includes in HTTTP Reqeussts if the setting:
    // `Markconf.Defaults.processIncludesInHttpRequests`, is not true
    if ({}.hasOwnProperty.call(Markconf.defaults, 'processIncludesInHttpRequests') === false ||
        Markconf.defaults.processIncludesInHttpRequests === false) {
      resolve(payload);
    }

    const [requestPath, modifier] = props;

    templateCompiler.compileTemplate(requestPath, modifier, payload.data)
    .then(modifiedHtml => {
      payload.data = modifiedHtml;
      resolve(payload);
    }).catch(err => {
      reject(err);
    });
  });
};

const handle = (pattern, requestPath, res, req) => {
  const modifier = Markconf.plugins.modifiers[pattern];
  const definitionType = Array.isArray(modifier) ? 'array' : 'object';

  const props = [requestPath, modifier];

  if (definitionType === 'object') {
    modifier.httpResponseModifier(requestPath, res, req)
    .then(payload => {
      checkIncludes(payload, props)
      .then(payload => {
        httpRespond(payload, res, req);
        logHttpResponse(payload, req, pattern);
      });
    }).catch(err => {
      log.error(err);
    });
  } else if (definitionType === 'array') {
    handlerChainedModifiers(modifier, requestPath, res, req)
    .then(payload => {
      checkIncludes(payload, props)
      .then(payload => {
        httpRespond(payload, res, req);
        logHttpResponse(payload, req, pattern);
      });
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
  // console.log(patterns);
  // for (const pattern in patterns) {
  //   console.log(pattern);
  // }

  for (const pattern in patterns) {
    if ({}.hasOwnProperty.call(patterns, pattern)) {
      const match = minimatch(url, pattern, {
        matchBase: true,
        dot: true
      });

      if (match) {
        const module = patterns[pattern];

        // console.log(url, pattern, match);

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
  const isLastChar = str[str.length - 1] === char;
  // console.log(str, char, isLastChar)
  return isLastChar;
};

// The incomming request from the browser (req, res, next)
const handleRequest = (req, res) => {
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
