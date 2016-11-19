const fs = require('fs');
const deepEqual = require('deep-equal');

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

const registry = [];

module.exports = (name, pathToPlugin, type) => {
  // We need the real path in case the module was loaded via npm-link
  const realPathToPlugin = fs.realpathSync(pathToPlugin);
  const pluginModule = require.cache[realPathToPlugin];
  const initFunction = pluginModule.exports;

  log.trace('Plugin ' + log.ul(pathToPlugin) + ' is requesting registry.');

  let activePlugin;

  if (registry.indexOf(pathToPlugin) === -1) {
    try {
      if (type === 'modifier') {
        activePlugin = registerModifier(name, pathToPlugin, pluginModule, initFunction, markserv);
      } else if (type === 'includer') {
        activePlugin = registerIncluder(name, pathToPlugin, pluginModule, initFunction, markserv);
      }

      registry.push(pathToPlugin);
    } catch (err) {
      log.error(err);
      return false;
    }
  } else {
    log.warn('Plugin ' + log.ul(pathToPlugin) + ' already registered!');
    activePlugin = pluginModule;
  }

  return activePlugin;
};

