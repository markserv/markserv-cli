const fs = require('fs');
const path = require('path');

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
  let realPathToPlugin;

  try {
    realPathToPlugin = fs.realpathSync(pathToPlugin);
  } catch (err) {
    try {
      realPathToPlugin = fs.realpathSync(path.dirname(pathToPlugin));
    } catch (err) {
    }
  }

  let pluginModule;

  pluginModule = require.cache[realPathToPlugin];

  if (typeof pluginModule === 'undefined') {
    const pluginDir = realPathToPlugin;
    const pluginFile = pathToPlugin.split(realPathToPlugin + path.sep)[1];
    const pathWithJsExt = `${path.join(pluginDir, pluginFile)}.js`;
    pluginModule = require.cache[pathWithJsExt];
  }

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

  // activePlugin.exports.directory = path.dirname(pathToPlugin);

  return activePlugin;
};

