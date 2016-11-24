const path = require('path');
const fs = require('fs');

const Promise = require('bluebird');

const log = require('./core.logger');
const templateCompiler = require('./template-compiler');

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

  // The original template that ships with the modifier module
  const modifierTemplate = null;
  const modifierTemplatePath = meta.templatePath;

  // The template as override in the Markconf configuration
  const markconfTemplate = null;
  const markconfTemplatePath = null;

  // The active compiled template that is used to render the view
  const template = '';

  // When the modifier has it's own template built-in
  const loadModifierTemplate = () => {
    return new Promise((resolve, reject) => {
      if ({}.hasOwnProperty.call(meta, 'templatePath')) {
        const pathToTemplate = meta.templatePath;

        templateCompiler.compileTemplate(pathToTemplate, ModifierModule)
        .then(html => {
          ModifierModule.exports.modifierTemplate = html;
          ModifierModule.exports.template = html;
          resolve(html);
          log.trace(`Template compiled: ${log.ul(pathToTemplate)}`);
          resolve(html);
        })
        .catch(err => {
          reject(err);
        });
      } else {
        // For modifiers that have no template, we should return success without
        // trying to load a template
        resolve();
      }
    });
  };

  // This will compile over the old template and insert/passthrough the
  // modifiers original template using syntax: <!--markserv|{modifier-template}-->
  const updateTemplate = newTemplatePath => {
    ModifierModule.exports.modifierTemplatePath = newTemplatePath;
    return new Promise((resolve, reject) => {
      templateCompiler.compileTemplate(newTemplatePath, ModifierModule)
      .then(html => {
        ModifierModule.exports.markconfTemplate = html;
        ModifierModule.exports.template = html;
        resolve(html);
        log.trace(`Template compiled: ${log.ul(newTemplatePath)}`);
      })
      .catch(err => {
        reject(err);
      });
    });
  };

  const reloadModifier = () => {};

  const exports = {
    name,
    meta,
    template,
    modifierTemplate,
    modifierTemplatePath,
    markconfTemplate,
    markconfTemplatePath,
    updateTemplate,
    loadModifierTemplate,
    reloadModifier
  };

  const httpResponseModifier = initFunction(exports, markserv);

  ModifierModule.exports = exports;

  ModifierModule.exports.httpResponseModifier = httpResponseModifier;

  ModifierModule.exports.configure = conf => {
    return new Promise((resolve, reject) => {
      log.trace('Modifier ' + log.hl(meta.name) + ' received a new Markconf configuration.');

      ModifierModule.exports.Markconf = conf;

      templateCompiler.configure(conf);

      const hasModifierTemplate = typeof ModifierModule.exports.modifierTemplatePath === 'string';
      const hasMarkconfTemplate = typeof ModifierModule.exports.markconfTemplatePath === 'string';

      if (hasModifierTemplate === false) {
        return resolve();
      }

      if (hasModifierTemplate && hasMarkconfTemplate === false) {
        ModifierModule.exports.loadModifierTemplate().then(() => {
          resolve();
        }).catch(err => {
          reject(err);
        });
        return;
      }

      if (hasModifierTemplate && hasMarkconfTemplate) {
        const promiseStack = [];

        promiseStack.push(ModifierModule.exports.loadModifierTemplate());
        promiseStack.push(ModifierModule.exports.updateTemplate(ModifierModule.exports.markconfTemplatePath));

        Promise.all(promiseStack).then(() => {
          resolve();
        }).catch(err => {
          reject(err);
        });
      }
    });
  };

  return ModifierModule;
};
