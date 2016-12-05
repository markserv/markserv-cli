const modifier = require('app/lib/plugin/modifier');
const includer = require('app/lib/plugin/includer');
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

let Markconf;

const configure = conf => {
	Markconf = conf;
};

const register = (packageName, key, type) => {
	const resolvedPackageLink = require.resolve(packageName);
	const pluginModule = require.cache[resolvedPackageLink];

	const initFunction = pluginModule.exports;

	log.trace('Plugin ' + log.ul(resolvedPackageLink) + ' is requesting registry.');

	let registeredPlugin;

	if (registry.indexOf(resolvedPackageLink) === -1) {
		try {
			if (type === 'modifier') {
				const modInitProps = [
					key,
					resolvedPackageLink,
					pluginModule,
					initFunction,
					markserv,
					Markconf
				];

				registeredPlugin = modifier.add(modInitProps);
			} else if (type === 'includer') {
				const incInitProps = [
					key,
					pluginModule,
					initFunction,
					markserv,
					Markconf
				];

				registeredPlugin = includer.add(incInitProps);
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

module.exports = {
	configure,
	register
};
