const log = require('app/lib/core/log');
const modifier = require('app/lib/plugin/modifier');
const includer = require('app/lib/plugin/includer');
const help = require('app/lib/help/plugins');

module.exports = Markconf => {
	const helpers = help(Markconf);
	const publicHelpers = {
		// File System
		readfile: helpers.fs.readfile,
		isMarkdownFile: helpers.fs.isMarkdownFile,

		// Logging
		trace: log.trace,
		info: log.info,
		debug: log.debug,
		warn: log.warn,
		error: log.error,
		fatal: log.fatal
	};

	const createModifier = modifier(Markconf);
	const createIncluder = includer(Markconf);

	const register = (packageName, key, type) => {
		const resolvedPackageLink = require.resolve(packageName);
		const pluginModule = require.cache[resolvedPackageLink];

		const initFunction = pluginModule.exports;

		log.trace('Plugin ' + log.ul(resolvedPackageLink) + ' is requesting registry.');

		let registeredPlugin;

		try {
			if (type === 'modifier') {
				const modInitProps = [
					key,
					resolvedPackageLink,
					initFunction,
					publicHelpers
				];

				registeredPlugin = createModifier(modInitProps);
			} else if (type === 'includer') {
				const incInitProps = [
					key,
					initFunction,
					publicHelpers
				];

				registeredPlugin = createIncluder(incInitProps);
			}
		} catch (err) {
			log.error(`Plugin ${log.hl(packageName)} could not be registered.`);
			console.log(err);
			log.error(err);
			return 'PLUGIN COULD NOT BE REGISTERED';
		}

		return registeredPlugin;
	};

	return {
		register
	};
};
