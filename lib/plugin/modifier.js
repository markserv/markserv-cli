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

	exports.pluginTemplate = pluginExports.template;
	exports.pluginTemplateUrl = pluginExports.templateUrl;

	exports.configTemplate = null;
	exports.configTemplateUrl = null;

	Object.defineProperty(exports, 'template', {
		get: () => {
			return exports.configTemplate || exports.pluginTemplate || null;
		}
	});

	exports.setOptions = newOpts => {
		exports.options = newOpts;
	};

	const loadTemplate = (url, type) => new Promise((resolve, reject) => {
		config.compiler.compileTemplate(url, exports).then(html => {
			log.trace(`${log.hl(type)} ${log.ul(url)} coompiled for ${log.hl(exports.name)}`);
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

		const promiseStack = [];

		if (exports.pluginTemplateUrl) {
			const url = path.join(pluginPath, exports.pluginTemplateUrl);
			promiseStack.push(loadTemplate(url, 'pluginTemplate'));
		}

		if (exports.configTemplateUrl) {
			const url = path.join(config.MarkconfUrl, exports.configTemplateUrl);
			promiseStack.push(loadTemplate(url, 'configTemplate'));
		}

		console.log(promiseStack);

		if (promiseStack.length === 0) {
			return resolve(initPlugin(exports));
		}

		return Promise.all(promiseStack).then(() => {
			resolve(initPlugin(exports));
		}).catch(err => {
			reject(err);
		});
	});

	// exports: 1st-PASS
	return exports;
};
