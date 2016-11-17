const fs = require('fs');

const registerModifier = require('./plugin.register-modifier');
const registerIncluder = require('./plugin.register-includer');

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

module.exports = (name, nodePackage, initFunction, pathToPlugin, type) => {

  // We need the real path in case the module was loaded via npm-link
  const realPathToPlugin = fs.realpathSync(pathToPlugin);
  const pluginModule = require.cache[realPathToPlugin];

  log.trace('Plugin ' + log.ul(pathToPlugin) + ' is requesting registry.');

  try {
    let activePlugin;

    if (type === 'modifiers') {
      activePlugin = registerModifier(name, pathToPlugin, pluginModule, initFunction, markserv);
    } else if (type === 'includers') {
      activePlugin = registerIncluder(name, pathToPlugin, pluginModule, initFunction, markserv);
    }

    return activePlugin;
  } catch (err) {
    log.error(err);
    return false;
  }
};

