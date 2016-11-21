const exception = (modifierName, should) => {
  const errorText = log.hl(modifierName) + ' ' + log.red(should);
  log.error(errorText);
  throw new Error(errorText);
};

const ownProp = (obj, ref) => {
  return {}.hasOwnProperty.call(obj, ref);
};

const verifyModifier = (activeModule, modifierName, importDepth) => {
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

  if (ownProp(activeModule, 'httpResponseModifier') &&
  typeof activeModule.httpResponseModifier === 'function') {
    score += 1;
  } else {
    exception(modifierName,
      'should have an httpResponseModifier callback function');
  }

  if (ownProp(activeModule, 'meta') && typeof activeModule.meta === 'object') {
    score += 1;
  } else {
    exception(modifierName, 'should contain meta object');
  }

  if (ownProp(activeModule.meta, 'name') &&
    typeof activeModule.meta.name === 'string') {
    score += 1;
  } else {
    exception(modifierName, 'should contain meta.name string');
  }

  const pass = score === requirements;

  if (pass) {
    log.trace('Modifier verified: ' + log.hl(modifierName), importDepth);
  } else {
    const fails = score - requirements;
    log.error(log.red('MODIFIER NOT VERIFIED: ') + log.hl(modifierName) +
      log.red(' (' + fails + ' failures)'), importDepth);
  }

  return pass;
};

const verifyIncluder = (activeModule, includerName, importDepth) => {
  let score = 0;
  const requirements = 4;

  // When the module loader above could not load any modifier module
  if (!activeModule) {
    return false;
  }

  if (typeof activeModule === 'object') {
    score += 1;
  } else {
    exception(includerName, 'should be an object');
  }

  if (ownProp(activeModule, 'htmlCommentIncluder') &&
  typeof activeModule.htmlCommentIncluder === 'function') {
    score += 1;
  } else {
    exception(includerName,
      'should have an htmlCommentIncluder callback function');
  }

  if (ownProp(activeModule, 'meta') && typeof activeModule.meta === 'object') {
    score += 1;
  } else {
    exception(includerName, 'should contain meta object');
  }

  if (ownProp(activeModule.meta, 'name') &&
    typeof activeModule.meta.name === 'string') {
    score += 1;
  } else {
    exception(includerName, 'should contain meta.name string');
  }

  const pass = score === requirements;

  if (pass) {
    log.trace('Modifier verified: ' + log.hl(includerName), importDepth);
  } else {
    const fails = score - requirements;
    log.error(log.red('INCLUDER NOT VERIFIED: ') + log.hl(includerName) +
      log.red(' (' + fails + ' failures)'), importDepth);
  }

  return pass;
};

module.exports = {
  includer: verifyIncluder,
  modifier: verifyModifier
};

