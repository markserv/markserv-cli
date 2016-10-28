const path = require('path');
const log = require('./core.logger');
const fs = require('./help.fs');

const loadModifier = (name, modifierPath, initPath, confPath) => {
  console.log(name, modifierPath);
  const markservAppPath = path.join(initPath, 'node_modules', modifierPath, 'Markconf.js');

  if (fs.fileExistsSync(markservAppPath)) {
    log.trace('Modifier ' + log.ul(name) + ' is a Markserv app at: ' + log.ul(markservAppPath) + '.');
  }

  // console.log(checkForChildMarkconf(modifierPath));
  // const modifierModule = require(path);
  // console.log(fs.fileExists(path);
};

// Resolve & require modifier modules for Markconf {core, path}
const resolveModifiers = (Markconf, confPath, initPath) => {
  if (Markconf.modifiers && Markconf.modifiers.core) {
    log.trace('Markconf ' + log.ul(confPath) + ' contains ' + log.hl('core') + ' modifiers.');

    for (const modifier in Markconf.modifiers.core) {
      if ({}.hasOwnProperty.call(Markconf.modifiers.core, modifier)) {
        const modifierPath = Markconf.modifiers.core[modifier];
        loadModifier(modifier, modifierPath, initPath, confPath);
      }
    }
  }
};

const resolveMarkconf = providedPath => {
  const initPath = path.resolve(providedPath || './');
  const confPath = path.resolve(path.join(initPath, 'Markconf.js'));
  log.trace('Resolving Markcong for path: ' + log.ul(confPath));

  let Markconf;
  let error;

  try {
    Markconf = require(confPath);
  } catch (err) {
    error = err;
    Markconf = false;
  }

  if (Markconf) {
    log.trace('Markconf ' + log.ul(confPath) + ' loaded successfully.');
    log.trace(Markconf);
    return resolveModifiers(Markconf, confPath, initPath);
  }

  log.error('Markconf ' + log.ul(confPath) + ' could not be loaded!');
  return error;
};

module.exports = {
  resolveMarkconf
};
