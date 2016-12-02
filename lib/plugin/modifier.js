const path = require('path');
const fs = require('fs');

const Promise = require('bluebird');

const templateCompiler = require('app/lib/http/compiler');
const log = require('app/lib/core/log');

module.exports = (name, modulePath, ModifierModule, initFunction, markserv) => { // eslint-disable-line max-params
	log.trace('Registering modifier: ' + modulePath);

	const pluginDef = initFunction(exports, markserv);

	const pluginName = pluginDef.name || name;
	const options = pluginDef.options;

	// The original template that ships with the modifier module
	const modifierTemplate = null;
	const templatePath = pluginDef.templatePath;

	// The template as override in the Markconf configuration
	const markconfTemplate = null;
	const markconfTemplatePath = null;

	// The active compiled template that is used to render the view
	const template = pluginDef.template || '';

	// When the modifier has it's own template built-in
	const loadModifierTemplate = () => new Promise((resolve, reject) => {
		// For modifiers that have no template, we should return success
		// without trying to load a template
		if (typeof pluginDef.templatePath !== 'string') {
			resolve(template);
		}

		const url = path.join(path.dirname(modulePath), templatePath);

		templateCompiler.compileTemplate(url, ModifierModule)
		.then(html => {
			ModifierModule.exports.modifierTemplate = html;
			ModifierModule.exports.template = html;
			log.trace(`Template compiled: ${log.ul(url)}`);
			resolve(html);
		})
		.catch(err => {
			reject(err);
		});
	});

	// This will compile over the old template and insert/passthrough the
	// modifiers original template using syntax: <!--markserv|{modifier-template}-->
	const setTemplate = newTemplatePath => new Promise((resolve, reject) => {
		ModifierModule.exports.templatePath = newTemplatePath;
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

	const setOptions = newOpts => {
		ModifierModule.options = newOpts;
	};

	exports.name = pluginName;
	exports.options = options;
	exports.setOptions = setOptions;
	exports.template = template;
	exports.templatePath = templatePath;
	exports.modifierTemplate = modifierTemplate;
	exports.markconfTemplate = markconfTemplate;
	exports.markconfTemplatePath = markconfTemplatePath;
	exports.setTemplate = setTemplate;
	exports.loadModifierTemplate = loadModifierTemplate;

	exports.configure = conf => new Promise((resolve, reject) => {
		log.trace('Modifier ' + log.hl(name) + ' received a new Markconf configuration.');

		ModifierModule.exports.Markconf = conf;

		templateCompiler.configure(conf);

		const hasModifierTemplate = typeof ModifierModule.exports.templatePath === 'string';
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
			ModifierModule.exports.loadModifierTemplate()
			.then(() => {
				ModifierModule.exports.updateTemplate(ModifierModule.exports.markconfTemplatePath)
					.then(() => {
						resolve();
					});
			})
			.catch(err => {
				reject(err);
			});
		}
	});

	ModifierModule.exports = exports;

	const plugin = pluginDef.plugin(ModifierModule.exports, markserv);

	exports.httpResponseModifier = plugin.main;

	return ModifierModule.exports;
};
