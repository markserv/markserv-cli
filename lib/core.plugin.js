// const callerId = require('caller-id');
const plugin = require('./plugin.register-modifier');
const log = require('./core.logger');
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

// The plugins use these exports as helper functions
const markserv = module.exports;

module.exports = (name, nodePackage, initFunction) => {
  const pathToPlugin = require.resolve(nodePackage);
  const pluginModule = require.cache[pathToPlugin];

  log.trace('Plugin ' + log.ul(pathToPlugin) + ' is requesting registry.');

  try {
    const activePlugin = plugin(name, pathToPlugin, pluginModule, initFunction, markserv);
    return activePlugin;
  } catch (err) {
    log.error(err);
    return false;
  }
};

