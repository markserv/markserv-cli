const path = require('path');
const log = require('./core.logger');
const fs = require('./help.fs');

const loadModifier = (name, modifierPath, confDir, dp) => {
  const modPath = path.join(confDir, 'node_modules', modifierPath);
  const appFile = path.join(modPath, 'Markconf.js');

  // 1) Try linking from external Markserv App definition
  if (fs.fileExistsSync(appFile)) {
    log.trace('Modifier ' + log.ul(name) + ' points to Markserv App: ' + log.ul(modPath) + '.', dp);
    return module.exports.resolveMarkconf(modPath, dp);
  }

  let activeModule;
  const errors = [];

  // 2) Try require(npm-module)
  try {
    activeModule = require(modPath);
    log.trace('Found modifier: ' + log.ul(name) + ' as NPM Module: ' + log.ul(modPath) + '.', dp);
    return activeModule;
  } catch (err) {
    errors.push(err);
  }

  // 3) Try local script
  try {
    const scriptPath = path.join(confDir, modifierPath);
    activeModule = require(scriptPath);
    log.trace('Found modifier: ' + log.ul(name) + ' as local script: ' + log.ul(scriptPath) + '.', dp);
    return activeModule;
  } catch (err) {
    errors.push(err);
  }

  if (errors.length > 0) {
    log.error(errors);
    return false;
  }
};

const verifyApp = activeModule => {
  if (typeof activeModule === 'object') {
    return true;
  }
};

const verifyModifier = activeModule => {
  let score = 0;
  const pass = 1;

  // When the module loader above could not load any modifier module
  if (!activeModule) {
    return false;
  }

  if ({}.hasOwnProperty.call(activeModule, 'pass')) {
    score += 1;
  }

  return score === pass;
};

// Resolve & require modifier modules for Markconf {core, path}
const resolveModifiers = (Markconf, confFile, confDir, dp) => {
  const markconfModules = {
    includers: {},
    modifiers: {
      core: {},
      path: {}
    }
  };

  if (Markconf.modifiers && Markconf.modifiers.core) {
    log.trace('Markconf ' + log.ul(confFile) + ' contains ' + log.hl('core') + ' modifiers.', dp);

    for (const modifierName in Markconf.modifiers.core) {
      if ({}.hasOwnProperty.call(Markconf.modifiers.core, modifierName)) {
        const modifierPath = Markconf.modifiers.core[modifierName];
        const activeModule = loadModifier(modifierName, modifierPath, confDir, dp);
        const isModifier = verifyModifier(activeModule);

        // Returned module is a modifier
        if (typeof activeModule === 'object' && isModifier) {
          markconfModules.modifiers.core[modifierName] = activeModule;
          continue;
        }

        // Returned module is an app
        if (typeof activeModule === 'object' && !isModifier) {
          markconfModules.modifiers.core[modifierName] = activeModule.modifiers.core[modifierName];
          continue;
        }

        markconfModules.modifiers.core[modifierName] = null;
      }
    }
  }

  return markconfModules;
};

const resolveMarkconf = (providedPath, dp) => {
  // Depth count used for debugging
  if (dp === undefined) {
    dp = 0;
  } else {
    dp += 1;
  }

  const confDir = path.resolve(providedPath || './');
  const confFile = path.resolve(path.join(confDir, 'Markconf.js'));
  log.trace('Resolving Markconf for path: ' + log.ul(confFile), dp);

  let Markconf;
  let error;

  try {
    Markconf = require(confFile);
  } catch (err) {
    error = err;
    Markconf = false;
  }

  if (Markconf) {
    log.trace('Markconf ' + log.ul(confFile) + ' loaded successfully.', dp);
    log.trace(Markconf);
    return resolveModifiers(Markconf, confFile, confDir, dp);
  }

  log.error('Markconf ' + log.ul(confFile) + ' could not be loaded!', dp);
  return error;
};

module.exports = {
  resolveMarkconf
};
