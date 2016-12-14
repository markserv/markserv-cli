const path = require('path');

const Promise = require('bluebird');

const log = require('app/lib/core/log');

module.exports = config => props => {
	const [
		pluginName,
		pluginPath,
		pluginExports
	] = props;

	log.trace(`Registering modifier: ${log.ul(pluginPath)}.`);

	// The `exports` object is the extenal interface for the loaded plugin.
	// It is NOT the same as the plugin's module.exports.
	const exports = {};

	exports.name = pluginExports.name || pluginName;
	exports.options = pluginExports.options;
	exports.template = pluginExports.template;

	exports.pluginTemplate = pluginExports.template;
	exports.pluginTemplateUrl = pluginExports.templateUrl;

	exports.configTemplate = null;
	exports.configTemplateUrl = null;

	// Eg: Markconf.js {import: 'markserv-app.foo', modifiers: {'**/': {module: '@import'}}}
	exports.subPlugin = null;

	Object.defineProperty(exports, 'template', {
		get: () => {
			return exports.configTemplate || exports.pluginTemplate || null;
		},
		set: () => {}
	});

	exports.setOptions = newOpts => {
		exports.options = newOpts;
	};

	const loadTemplate = (url, type) => new Promise((resolve, reject) => {
		config.compiler.compileTemplate(url, exports).then(html => {
			log.trace(`${log.hl(type)} ${log.ul(url)} compiled for ${log.hl(exports.name)}`);
			exports[type] = html;
			resolve(html);
		}).catch(err => {
			log.error(`Error compiling template: ${log.ul(url)}`);
			reject(err);
		});
	});

	exports.setConfigTemplate = html => {
		exports.configTemplate = html;
	};

	exports.setConfigTemplateUrl = url => {
		exports.configTemplateUrl = url;
	};

	exports.setSubPlugin = plugin => {
		exports.subPlugin = plugin;
	};

	const initPlugin = () => {
		exports.handle = pluginExports.plugin(exports, config);
		return exports;
	};

	// Plugins are initiated 2-PASS.
	// The first pass is used to register the plugin.
	// The secod pass is used to configure the plugin with the Markserv service.

	// configure: 2nd-PASS
	exports.configure = newConfig => new Promise((resolve, reject) => {
		log.trace('Modifier ' + log.hl(pluginName) + ' received a new Markconf configuration.');
		config = newConfig;

		if (exports.pluginTemplateUrl && exports.configTemplateUrl) {
			const pluginTemplateFile = path.join(pluginPath, exports.pluginTemplateUrl);
			return loadTemplate(pluginTemplateFile, 'pluginTemplate').then(() => {
				const configTemplateFile = path.join(config.MarkconfDir, exports.configTemplateUrl);

				loadTemplate(configTemplateFile, 'configTemplate')
				.then(() => {
					resolve(initPlugin(exports));
				})
				.catch(reject);
			}).catch(reject);
		}

		if (exports.pluginTemplateUrl) {
			const pluginTemplateFile = path.join(pluginPath, exports.pluginTemplateUrl);
			return loadTemplate(pluginTemplateFile, 'pluginTemplate')
			.then(() => {
				resolve(initPlugin(exports));
			})
			.catch(reject);
		}

		if (exports.configTemplateUrl) {
			const configTemplateFile = path.join(config.MarkconfDir, exports.configTemplateUrl);
			return loadTemplate(configTemplateFile, 'configTemplate')
			.then(() => {
				resolve(initPlugin(exports));
			})
			.catch(reject);
		}

		resolve(initPlugin(exports));
	});

	// exports: 1st-PASS
	return exports;
};
