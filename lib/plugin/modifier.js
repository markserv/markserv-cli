const path = require('path');

const Promise = require('bluebird');

const log = require('app/lib/core/log');
const compiler = require('app/lib/http/compiler');

const add = props => {
	const [name, modPath, ModMod, plugDef, help, conf] = props;

	log.trace(`Registering modifier: ${log.ul(modPath)}.`);

	const pluginName = plugDef.name || name;
	const options = plugDef.options;

	// The original template that ships with the modifier module
	const modifierTemplate = null;
	const templatePath = plugDef.templatePath;

	// The template as override in the Markconf configuration
	const markconfTemplate = null;
	const markconfTemplatePath = null;

	// The active compiled template that is used to render the view
	const template = plugDef.template || '';

	// When the modifier has it's own template built-in
	const loadModifierTemplate = () => new Promise((resolve, reject) => {
		// For modifiers that have no template, we should return success
		// without trying to load a template
		if (typeof plugDef.templatePath !== 'string') {
			resolve(template);
		}

		const url = path.join(path.dirname(modPath), templatePath);

		compiler.compileTemplate(url, ModMod)
		.then(html => {
			ModMod.exports.modifierTemplate = html;
			ModMod.exports.template = html;
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
		ModMod.exports.templatePath = newTemplatePath;
		compiler.compileTemplate(newTemplatePath, ModMod)
		.then(html => {
			ModMod.exports.markconfTemplate = html;
			ModMod.exports.template = html;
			resolve(html);
			log.trace(`Template compiled: ${log.ul(newTemplatePath)}`);
		})
		.catch(err => {
			reject(err);
		});
	});

	const configure = conf => new Promise((resolve, reject) => {
		log.trace('Modifier ' + log.hl(name) + ' received a new Markconf configuration.');

		ModMod.exports.Markconf = conf;
		// templateCompiler.configure(conf); // should already be configured?

		const templateContent = ModMod.exports.template;

		const hasModifierTemplatePath = typeof ModMod.exports.templatePath === 'string';
		const hasMarkconfTemplatePath = typeof ModMod.exports.markconfTemplatePath === 'string';

		// When a template is exported as a string and no template in the conf
		// is overriding it, then pass back the original template exported.
		if (typeof templateContent === 'string' &&
			hasModifierTemplatePath === false &&
			hasMarkconfTemplatePath === false) {
			return resolve();
		}

		// When there is a template exported for this plugin, but there is not
		// and override template in the Markconf file, we want to loade the
		// plugin's template and use that.
		if (hasModifierTemplatePath && hasMarkconfTemplatePath === false) {
			ModMod.exports.loadModifierTemplate().then(() => {
				resolve();
			}).catch(err => {
				reject(err);
			});
			return;
		}

		// When the plugin has a template and the Markconf has an override
		// template, then we want to load both. Sometimes the plugin template
		// will be referenced as an include with in the override template
		// specified in the Markconf.
		if (hasModifierTemplatePath && hasMarkconfTemplatePath) {
			ModMod.exports.loadModifierTemplate()
			.then(() => {
				ModMod.exports.setTemplate(ModMod.exports.markconfTemplatePath)
					.then(() => {
						resolve();
					});
			})
			.catch(err => {
				reject(err);
			});
		}
	});

	const setOptions = newOpts => {
		ModMod.options = newOpts;
	};

	const setMarkconfTemplatePath = templatePath =>
	new Promise((resolve, reject) => {
		ModMod.exports.markconfTemplatePath = templatePath;
		ModMod.exports.setTemplate(ModMod.exports.markconfTemplatePath)
		.then(html => {
			resolve();
		}).catch(reject);
	});

	ModMod.exports = {
		configure,
		name: pluginName,
		options,
		setOptions,
		template,
		templatePath,
		modifierTemplate,
		markconfTemplate,
		markconfTemplatePath,
		setTemplate,
		setMarkconfTemplatePath,
		loadModifierTemplate
	};

	ModMod.exports.httpResponseModifier = plugDef.plugin(ModMod.exports, help, options, conf);

	return ModMod.exports;
};

module.exports = {
	add
};
