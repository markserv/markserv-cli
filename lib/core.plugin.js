const callerId = require('caller-id');
const plugin = require('./plugin.register-modifier');
const log = require('./core.logger');

module.exports = (name, callback) => {
  const moduleId = callerId.getData().filePath;
  const _module = require.cache[moduleId];

  log.trace('Plugin ' + log.ul(moduleId) + ' is requesting registry.');

  if (typeof name === 'function') {
    callback = name;
    try {
      plugin(_module, callback);
    } catch (err) {
      log.error(err);
    }
    return;
  }

  if (typeof name === 'string' && typeof callback === 'function') {
    try {
      plugin(_module, callback, name);
    } catch (err) {
      log.error(err);
    }
    return;
  }
};

const help = require('./core.help');

// File System
module.exports.readfile = help.fs.readfile;
module.exports.isMarkdownFile = help.fs.isMarkdownFile;

// Logging
module.exports.trace = help.log.trace;
module.exports.info = help.log.info;
module.exports.debug = help.log.debug;
module.exports.warn = help.log.warn;
module.exports.error = help.log.error;
module.exports.fatal = help.log.fatal;
