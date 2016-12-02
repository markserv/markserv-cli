const fs = require('fs');
const path = require('path');

const registerModifier = require('app/lib/plugin/modifier');
const registerIncluder = require('app/lib/plugin/includer');
const help = require('app/lib/help/plugins');
const log = require('app/lib/core/log');

// File System
module.exports.readfile = help.fs.readfile;
module.exports.isMarkdownFile = help.fs.isMarkdownFile;

// Logging
module.exports.trace = log.trace;
module.exports.info = log.info;
module.exports.debug = log.debug;
module.exports.warn = log.warn;
module.exports.error = log.error;
module.exports.fatal = log.fatal;

// The plugins use these exports as helper functions
const markserv = module.exports;

const registry = [];

module.exports = (packageName, key, type) => {
	// We need the real path in case the module was loaded via npm-link
	// let realPathToPlugin;

	// try {
	// 	realPathToPlugin = fs.realpathSync(key);
	// } catch (err) {
	// 	try {
	// 		realPathToPlugin = fs.realpathSync(path.dirname(pathToPlugin));
	// 	} catch (err) {
	// 	}
	// }
	const resolvedPackageLink = require.resolve(packageName);
	const pluginModule = require.cache[resolvedPackageLink];

	// console.log(pluginModule);
	// console.log(require.cache);

	// if (typeof pluginModule === 'undefined') {
	// 	const pluginDir = realPathToPlugin;
	// 	const pluginFile = pathToPlugin.split(realPathToPlugin + path.sep)[1];
	// 	const pathWithJsExt = `${path.join(pluginDir, pluginFile)}.js`;
	// 	pluginModule = require.cache[pathWithJsExt];
	// }

	const initFunction = pluginModule.exports;

	log.trace('Plugin ' + log.ul(resolvedPackageLink) + ' is requesting registry.');

	let registeredPlugin;

	if (registry.indexOf(resolvedPackageLink) === -1) {
		try {
			if (type === 'modifier') {
				registeredPlugin = registerModifier(key, resolvedPackageLink, pluginModule, initFunction, markserv);
			} else if (type === 'includer') {
				registeredPlugin = registerIncluder(key, resolvedPackageLink, pluginModule, initFunction, markserv);
			}

			registry.push(resolvedPackageLink);
		} catch (err) {
			log.error(err);
			return false;
		}
	} else {
		log.trace('Plugin ' + log.ul(resolvedPackageLink) + ' already registered!');
		registeredPlugin = pluginModule;
	}

	return registeredPlugin;
};

