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

const exception = (modifierName, should) => {
  const errorText = log.hl(modifierName) + ' ' + log.red(should);
  log.error(errorText);
  throw new Error(errorText);
};

const verifyModifier = (activeModule, modifierName, dp) => {
  let score = 0;
  const requirements = 4;

  // When the module loader above could not load any modifier module
  if (!activeModule) {
    return false;
  }

  if (typeof activeModule === 'object') {
    score += 1;
  } else {
    exception(modifierName, 'should be an object');
  }

  if (typeof activeModule.httpResponseModifier === 'function') {
    score += 1;
  } else {
    exception(modifierName, 'should have a httpResponseModifier callback function');
  }

  if (typeof activeModule.meta === 'object') {
    score += 1;
  } else {
    exception(modifierName, 'should contain meta object');
  }

  if (typeof activeModule.meta.name === 'string') {
    score += 1;
  } else {
    exception(modifierName, 'should contain meta.name string');
  }

  const pass = score === requirements;

  if (pass) {
    log.trace('Modifier module: ' + log.hl(modifierName) + ' verified.', dp);
  } else {
    log.error(log.red('Modifier module: ') + log.hl(modifierName) + log.red(' COULD NOT BE VERIFIED!'), dp);
  }

  return pass;
};

const resolveModifiers = (modifierClass, ActiveMarkconf, defs, dp) => {
  if (defs.Markconf.modifiers && defs.Markconf.modifiers[modifierClass]) {
    log.trace('Markconf ' + log.ul(defs.confFile) + ' contains ' + log.hl(modifierClass) + ' modifiers.', dp);

    for (const modifierName in defs.Markconf.modifiers[modifierClass]) {
      if ({}.hasOwnProperty.call(defs.Markconf.modifiers[modifierClass], modifierName)) {
        const modifierPath = defs.Markconf.modifiers[modifierClass][modifierName];
        const activeModule = loadModifier(modifierName, modifierPath, defs.confDir, dp);
        const isModifier = verifyModifier(activeModule, modifierName, dp);

        // Returned module is a modifier
        if (typeof activeModule === 'object' && isModifier) {
          ActiveMarkconf.modifiers[modifierClass][modifierName] = activeModule;
          continue;
        }

        // Returned module is an app
        if (typeof activeModule === 'object' && !isModifier) {
          ActiveMarkconf.modifiers[modifierClass][modifierName] = activeModule.modifiers[modifierClass][modifierName];
          // ActiveMarkconf.modifiers[modifierClass][modifierName].configure(defs.Markconf);
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

  providedPath = providedPath.split('Markconf.js')[0];

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

module.exports = resolveMarkconf;
