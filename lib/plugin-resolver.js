const path = require('path');
const log = require('./core.logger');
const fs = require('./help.fs');

const loadModifier = (name, modifierModuleName, confDir, dp) => {
  const modPath = path.join(confDir, 'node_modules', modifierModuleName);
  const appFile = path.join(modPath, 'Markconf.js');
  // console.log(modPath, appFile);

  // 1) Try linking from external Markserv App definition
  if (fs.fileExistsSync(appFile)) {
    log.trace('Modifier ' + log.ul(name) + ' points to Markserv App: ' + log.ul(modPath) + '.', dp);
    return {conf: module.exports(modPath, dp)};
  }

  let activeModule;
  const errors = [];

  // 2) Try require node module
  try {
    activeModule = require(modifierModuleName);
    log.trace('Found modifier: ' + log.ul(name) + ' as NPM Module: ' + log.ul(modPath) + '.', dp);
    return {module: activeModule};
  } catch (err) {
    errors.push(err);
  }

  // 3) Try local script
  try {
    const scriptPath = path.join(confDir, modifierModuleName);
    activeModule = require(scriptPath);
    log.trace('Found modifier: ' + log.ul(name) + ' as local script: ' + log.ul(scriptPath) + '.', dp);
    return {module: activeModule};
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
  // throw new Error(errorText);
};

const verifyModifier = (activeModule, modifierName, dp) => {
  let score = 0;
  const requirements = 2;

  // When the module loader above could not load any modifier module
  if (!activeModule) {
    return false;
  }

  if (typeof activeModule === 'object') {
    score += 1;
  } else {
    exception(modifierName, 'should be an object');
  }

  if ({}.hasOwnProperty.call(activeModule, 'httpResponseModifier') &&
  typeof activeModule.httpResponseModifier === 'function') {
    score += 1;
  } else {
    exception(modifierName, 'should have a httpResponseModifier callback function');
  }

  // if (typeof activeModule.meta === 'object') {
  //   score += 1;
  // } else {
  //   exception(modifierName, 'should contain meta object');
  // }

  // if (typeof activeModule.meta.name === 'string') {
  //   score += 1;
  // } else {
  //   exception(modifierName, 'should contain meta.name string');
  // }

  const pass = score === requirements;

  if (pass) {
    log.trace('Modifier module: ' + log.hl(modifierName) + ' verified.', dp);
  } else {
    log.error(log.red('Modifier module: ') + log.hl(modifierName) + log.red(' COULD NOT BE VERIFIED!'), dp);
  }

  return pass;
};

// const loadModifiersClassString = (modifierClass, ActiveMarkconf, defs, dp) => {
//   const modifierPath = defs.Markconf.modifiers[modifierClass];
//   const activeExternalMarkconf = loadModifier(modifierClass, modifierPath, defs.confDir, dp);
//   ActiveMarkconf.modifiers[modifierClass] = activeExternalMarkconf.modifiers[modifierClass];
//   return ActiveMarkconf;
// };

// const loadModifiersBlockString = (modifierClass, ActiveMarkconf, defs, dp) => {
//   const modifierPath = defs.Markconf.modifiers;
//   const activeExternalMarkconf = loadModifier(modifierClass, modifierPath, defs.confDir, dp);
//   ActiveMarkconf.modifiers = activeExternalMarkconf.modifiers;
//   return ActiveMarkconf;
// };

// const loadModifiersClassObject = (modifierClass, ActiveMarkconf, defs, dp) => {
//   log.trace('Markconf ' + log.ul(defs.confFile) + ' contains ' + log.hl(modifierClass) + ' modifiers.', dp);

//   for (const modifierName in defs.Markconf.modifiers[modifierClass]) {
//     if ({}.hasOwnProperty.call(defs.Markconf.modifiers[modifierClass], modifierName)) {
//       const modifierPath = defs.Markconf.modifiers[modifierClass][modifierName];
//       const activeModule = loadModifier(modifierName, modifierPath, defs.confDir, dp);
//       const isModifier = verifyModifier(activeModule, modifierName, dp);

//       // Returned module is a modifier
//       if (typeof activeModule === 'object' && isModifier) {
//         ActiveMarkconf.modifiers[modifierClass][modifierName] = activeModule;
//         continue;
//       }

//       // Returned module is an app
//       if (typeof activeModule === 'object' && !isModifier) {
//         ActiveMarkconf.modifiers[modifierClass][modifierName] = activeModule.modifiers[modifierClass][modifierName];
//         // ActiveMarkconf.modifiers[modifierClass][modifierName].configure(defs.Markconf);
//         continue;
//       }

//       ActiveMarkconf.modifiers[modifierClass][modifierName] = null;
//     }
//   }

//   return ActiveMarkconf;
// };

// const resolveModifiersByClass = (modifierClass, ActiveMarkconf, defs, dp) => {
//   // Then check if the modifier block was broken down into individual strings
//   // (Class will be "core" / "path / etc)
//   const hasModifiersWithClass = {}.hasOwnProperty.call(defs.Markconf.modifiers, modifierClass);

//   if (hasModifiersWithClass === false) {
//     log.trace('Markconf ' + log.ul(defs.confFile) + ' has no modifiers with class ' + log.hl(modifierClass) + '.', dp);
//   }

//   // Check string types for external imports, object types for local module includes
//   const modifierClassDeclarationType = typeof defs.Markconf.modifiers[modifierClass];

//   switch (modifierClassDeclarationType) {
//     case 'string':
//       loadModifiersClassString(modifierClass, ActiveMarkconf, defs, dp);
//       break;
//     case 'object':
//       loadModifiersClassObject(modifierClass, ActiveMarkconf, defs, dp);
//       break;
//     default:
//       break;
//   }

//   return ActiveMarkconf;
// };

// const resolveModifiersBlock = (ActiveMarkconf, defs, dp) => {
//   // If there is not modifiers block, then pass-through
//   const hasModifiers = {}.hasOwnProperty.call(defs.Markconf, 'modifiers');

//   if (hasModifiers === false) {
//     log.trace('Markconf ' + log.ul(defs.confFile) + ' has no modifiers block.', dp);
//     return ActiveMarkconf;
//   }

//   // The modifier block itself may be a string reference to another module or
//   // external configuration
//   const modifierDeclarationType = typeof defs.Markconf.modifiers;

//   if (modifierDeclarationType === 'string') {
//     loadModifiersBlockString(modifierClass, ActiveMarkconf, defs, dp);
//     return ActiveMarkconf;
//   } else if (modifierDeclarationType === 'object') {
//     loadModifiersBlockString(modifierClass, ActiveMarkconf, defs, dp);
//   }
// };

// const importModule = (reference, pathStr, defs, dp) => {
//   const activeModule = loadModifier(reference, pathStr, defs.confDir, dp);
//   console.log(activeModule);
//   // process.exit(1);
//   return activeModule;
// };

const deepExtract = (trace, conf) => {
  console.log(trace);
  let extraction = conf;
  for (const elem of trace) {
    extraction = extraction[elem];
  }
  return extraction;
};

const deepSpider = (conf, pattern, ancestorOfMatch, confDir, trace, importDepth) => {
  for (const reference in conf) { // eslint-disable-line guard-for-in
    const confMember = conf[reference];
    const type = typeof confMember;
    if (type === 'object') {
      const match = {}.hasOwnProperty.call(pattern, reference);
      ancestorOfMatch = match || ancestorOfMatch;
      trace.push(reference);
      pattern = pattern[reference];
      const next = deepSpider(confMember, pattern, ancestorOfMatch, confDir, trace, importDepth);
      conf[reference] = next;
    } else if (type === 'string') {
      const modifier = loadModifier(reference, confMember, confDir, importDepth);
      if (modifier.module) {
        conf[reference] = modifier.module;
        continue;
      } else if (modifier.conf) {
        const extraction = deepExtract(trace, modifier.conf);
        conf[reference] = extraction[reference];
        continue;
      }
    }
  }
  return conf;
};

const generateImportPattern = () => {
  const pattern = {
    includers: {},
    modifiers: {
      core: {},
      path: {}
    }
  };

  return pattern;
};

// Resolve & require modifier modules for Markconf {core, path}
const buildActiveMarkconf = (Markconf, confFile, confDir, importDepth) => {
  const importPattern = generateImportPattern();

  const trace = [];

  const ancestorOfMatch = false;

  // const defs = {
  // };

  const result = deepSpider(Markconf, importPattern, ancestorOfMatch, confDir,
    trace, importDepth);

  return result;
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
  log.trace('Resolving Markconf for path: ' + log.ul(confFile), dp, '');

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
