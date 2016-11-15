const path = require('path');
// const callerId = require('caller-id');
const plugin = require('./plugin.register-modifier');
const log = require('./core.logger');
const help = require('./core.help');
const fs = require('fs');

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

module.exports = (name, nodePackage, initFunction, pathToPlugin) => {
  // We need the real path in case the module was loaded via npm-link
  const realPathToPlugin = fs.realpathSync(pathToPlugin);
  const pluginModule = require.cache[realPathToPlugin];

  log.trace('Plugin ' + log.ul(pathToPlugin) + ' is requesting registry.');

  try {
    const activePlugin = plugin(name, pathToPlugin, pluginModule, initFunction, markserv);
    return activePlugin;
  } catch (err) {
    log.error(err);
    return false;
  }
};

