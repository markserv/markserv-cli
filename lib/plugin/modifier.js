// const path = require('path');

const Promise = require('bluebird');
// const cloneDeep = require('clone-deep');

const log = require('app/lib/core/log');
const compiler = require('app/lib/http/compiler');

module.exports = Markconf => props => {
	const [
		pluginName,
		pluginPath,
		pluginExports,
		markservHelpers
	] = props;

	console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
	console.log(pluginName);
	console.log(pluginPath);

	log.trace(`Registering modifier: ${log.ul(pluginPath)}.`);

	// The `exports` object is the extenal interface for the loaded plugin.
	// It is NOT the same as the plugin's module.exports.
	const exports = {};

	exports.pluginName = pluginExports.name || pluginName;
	exports.options = pluginExports.option;
	exports.template = pluginExports.template;
	exports.templatePath = pluginExports.templatePath;

	exports.setOptions = newOpts => {
		exports.options = newOpts;
	};

	const loadTemplate = filepath => new Promise((resolve, reject) => {
		compiler.compileTemplate(filepath, exports)
		.then(html => {
			log.trace(`Template compiled: ${log.ul(filepath)}`);
			resolve(html);
		})
		.catch(err => {
			reject(err);
		});
	});

	exports.setTemplate = html => {
		exports.template = html;
	};

	exports.setModifierTemplateUrl = url => {
		exports.modifierTemplateUrl = url;
	};

	exports.setMarkconfTemplateUrl = url => {
		exports.markconfTemplateUrl = url;
	};

	// Plugins are initiated 2-pass.
	// Everything above here is called 1-st pass.
	// Configure is called 2-nd pass.
	exports.configure = conf => new Promise((resolve, reject) => {
		log.trace('Modifier ' + log.hl(pluginName) + ' received a new Markconf configuration.');
		exports.Markconf = conf;

		// loadTemplate(filepath).then(html => {
		// 	exports.markconfTemplate = html;
		// 	resolve(html);
		// }).catch(reject);

		// loadTemplate(filepath).then(html => {
		// 	exports.modifierTemplate = html;
		// 	resolve(html);
		// }).catch(reject);

		exports.httpResponseModifier = pluginExports.plugin(exports, markservHelpers, exports.options, Markconf);
		resolve(exports);
	});

	return exports;
};
