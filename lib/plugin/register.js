const path = require('path');

const log = require('app/lib/core/log');
const modifier = require('app/lib/plugin/modifier');
const includer = require('app/lib/plugin/includer');

module.exports = config => {
	const createModifier = modifier(config);
	const createIncluder = includer(config);

	const register = (packageName, key, type) => {
		const resolvedPackageLink = require.resolve(packageName);
		const pluginModule = require.cache[resolvedPackageLink];

		const initFunction = pluginModule.exports;

		log.trace('Plugin ' + log.ul(resolvedPackageLink) + ' is requesting registry.');

		let registeredPlugin;

		try {
			if (type === 'modifier') {
				const pluginDir = path.dirname(resolvedPackageLink);
				const modInitProps = [key, pluginDir, initFunction];
				registeredPlugin = createModifier(modInitProps);
			} else if (type === 'includer') {
				const incInitProps = [key, initFunction];
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
