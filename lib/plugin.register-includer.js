const path = require('path');
const fs = require('fs');

const log = require('./core.logger');

const filterModulePkgMeta = (pkg, moduleDir) => {
  const meta = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description
  };

  if ({}.hasOwnProperty.call(pkg, 'author')) {
    meta.author = pkg.author;
  }

  if ({}.hasOwnProperty.call(pkg, 'template') && typeof pkg.template === 'string') {
    const templatePath = path.join(moduleDir, pkg.template);
    const realTemplatePath = fs.realpathSync(templatePath);
    meta.templatePath = realTemplatePath;
  }

  return meta;
};

const getModulePkg = (ModifierModule, moduleDir) => {
  let modulePkg;

  try {
    modulePkg = require(path.join(moduleDir, 'package.json'));
  } catch (err) {
    modulePkg = {
      name: ModifierModule.exports.name
    };
  }

  return modulePkg;
};

const buildModulePkgMeta = (ModifierModule, scriptDir) => {
  const moduleDir = scriptDir.split(`${path.sep}lib`)[0];
  const modulePkgData = getModulePkg(ModifierModule, moduleDir);
  const modulePkgMeta = filterModulePkgMeta(modulePkgData, moduleDir);
  return modulePkgMeta;
};

module.exports = (name, modulePath, ModifierModule, initFunction, markserv) => { // eslint-disable-line max-params
  log.trace('Registering modifier: ' + modulePath);

  const scriptDir = path.dirname(ModifierModule.id);
  const meta = buildModulePkgMeta(ModifierModule, scriptDir);

  if (meta.name) {
    name = meta.name;
  } else if (name) {
    meta.name = name;
  }

  const reloadIncluder = () => {};

  const exports = {
    name,
    meta,
    reloadIncluder
  };

  const htmlCommentIncluder = initFunction(exports, markserv);

  ModifierModule.exports = exports;

  ModifierModule.exports.htmlCommentIncluder = htmlCommentIncluder;

  ModifierModule.exports.configure = conf => {
    log.trace('Modifier ' + log.hl(meta.name) + ' received a new Markconf configuration.');
    ModifierModule.exports.Markconf = conf;
    // templateCompiler.configure(conf);
    // templateCompiler.compileTemplate(ModifierModule.exports.template);
  };

  return ModifierModule;
};
