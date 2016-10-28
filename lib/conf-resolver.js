const path = require('path');
const log = require('./core.logger');
const fs = require('./help.fs');

const loadModifier = (name, modifierModuleName, confDir, dp) => {
  const modPath = path.join(confDir, 'node_modules', modifierModuleName);
  const appFile = path.join(modPath, 'Markconf.js');

  // 1) Try linking from external Markserv App definition
  if (fs.fileExistsSync(appFile)) {
    log.trace('Modifier ' + log.ul(name) + ' points to Markserv App: ' + log.ul(modPath) + '.', dp);
    return module.exports.resolveMarkconf(modPath, dp);
  }

  let activeModule;
  const errors = [];

  // 2) Try require node module
  try {
    activeModule = require(modifierModuleName);
    log.trace('Found modifier: ' + log.ul(name) + ' as NPM Module: ' + log.ul(modPath) + '.', dp);
    return activeModule;
  } catch (err) {
    errors.push(err);
  }

  // 3) Try local script
  try {
    const scriptPath = path.join(confDir, modifierModuleName);
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

const resolveModifiers = (modifierClass, ActiveMarkconf, defs, dp) => {
  if (defs.Markconf.modifiers && defs.Markconf.modifiers[modifierClass]) {
    log.trace('Markconf ' + log.ul(defs.confFile) + ' contains ' + log.hl(modifierClass) + ' modifiers.', dp);

    for (const modifierName in defs.Markconf.modifiers[modifierClass]) {
      if ({}.hasOwnProperty.call(defs.Markconf.modifiers[modifierClass], modifierName)) {
        const modifierPath = defs.Markconf.modifiers[modifierClass][modifierName];
        const activeModule = loadModifier(modifierName, modifierPath, defs.confDir, dp);
        const isModifier = verifyModifier(activeModule);

        // Returned module is a modifier
        if (typeof activeModule === 'object' && isModifier) {
          ActiveMarkconf.modifiers[modifierClass][modifierName] = activeModule;
          continue;
        }

        // Returned module is an app
        if (typeof activeModule === 'object' && !isModifier) {
          ActiveMarkconf.modifiers[modifierClass][modifierName] = activeModule.modifiers[modifierClass][modifierName];
          continue;
        }

        ActiveMarkconf.modifiers[modifierClass][modifierName] = null;
      }
    }
  } else {
    log.trace('Markconf ' + log.ul(defs.confFile) + ' has no ' + log.hl(modifierClass) + ' modifiers.', dp);
  }

  return ActiveMarkconf;
};

// Resolve & require modifier modules for Markconf {core, path}
const buildActiveMarkconf = (Markconf, confFile, confDir, dp) => {
  let ActiveMarkconf = {
    includers: {},
    modifiers: {
      core: {},
      path: {}
    }
  };

  const defs = {
    Markconf,
    confFile,
    confDir
  };

  const core = resolveModifiers('core', ActiveMarkconf, defs, dp);
  const path = resolveModifiers('path', ActiveMarkconf, defs, dp);

  ActiveMarkconf = Object.assign(ActiveMarkconf, core, path);

  return ActiveMarkconf;
};

const resolveMarkconf = (providedPath, dp) => {
  // Depth count used for debugging
  if (dp === undefined) {
    dp = 0;
  } else {
    dp += 1;
  }

  console.log(path.dirname(providedPath));

  const confDir = path.resolve(providedPath);
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
    return buildActiveMarkconf(Markconf, confFile, confDir, dp);
  }

  log.error('Markconf ' + log.ul(confFile) + ' could not be loaded!', dp);
  return error;
};

module.exports = {
  resolveMarkconf
};
