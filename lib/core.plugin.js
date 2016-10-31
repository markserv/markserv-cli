const callerId = require('caller-id');
const plugin = require('./plugin.register-modifier');

module.exports = (name, callback) => {
  const moduleId = callerId.getData().filePath;
  const _module = require.cache[moduleId];

  if (typeof name === 'function') {
    callback = name;
    plugin(_module, callback);
    return;
  }

  if (typeof name === 'string' && typeof callback === 'function') {
    plugin(_module, callback, name);
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