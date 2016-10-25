const path = require('path');

const getCaller = () => {
  const getStack = () => {
    const origPrepareStackTrace = Error.prepareStackTrace;

    Error.prepareStackTrace = function (_, stack) {
      return stack;
    };

    const err = new Error();
    const stack = err.stack;
    Error.prepareStackTrace = origPrepareStackTrace;

    stack.shift();

    return stack;
  };

  const stack = getStack();
  stack.shift();
  stack.shift();
  return stack[1].receiver;
};

const filterModulePkgMeta = pkg => {
  const meta = {
    name: pkg.name,
    template: pkg.template,
    version: pkg.version,
    description: pkg.description
  };

  if ({}.hasOwnProperty.call(pkg, 'author')) {
    meta.author = pkg.author;
  }

  return meta;
};

const getModulePkg = ModifierModule => {
  let modulePkg;
  let moduleDir = path.dirname(ModifierModule.id);

  try {
    moduleDir = moduleDir.split('/mod')[0];
    modulePkg = require(moduleDir + '/package.json');
  } catch (err) {
    modulePkg = {
      name: ModifierModule.exports.name
    };
  }

  return modulePkg;
};

const buildModulePkgMeta = ModifierModule => {
  const modulePkgData = getModulePkg(ModifierModule);
  const modulePkgMeta = filterModulePkgMeta(modulePkgData);
  return modulePkgMeta;
};

const compileTemplate = templatePath => {
  return 'ZZZZZZZZZ+' + templatePath;
};

module.exports = (ModifierModule, modifierName, initFunction) => {
  let Markconf;

  ModifierModule.exports.name = modifierName;

  if (typeof modifierName === 'function') {
    initFunction = modifierName;
    ModifierModule.exports.name = 'Unnamed Modifier';
  }

  // console.log('-------------------------------');

  const configure = conf => {
    Markconf = conf;
  };

  const meta = buildModulePkgMeta(ModifierModule);

  const templatePath = meta.template;

  const loadTemplate = () => {
    return compileTemplate(templatePath);
  };

  const template = loadTemplate();

  const loadModifier = () => {};

  const httpResponseModifier = initFunction(Markconf, template);

  ModifierModule.exports = {
    configure,
    Markconf,
    meta,
    template,
    templatePath,
    loadTemplate,
    loadModifier,
    httpResponseModifier
  };

  // const loadTemplate = () => {};
};
