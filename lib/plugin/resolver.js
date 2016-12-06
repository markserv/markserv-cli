const path = require('path');

const log = require('app/lib/core/log');
const registry = require('app/lib/plugin/register');
const compiler = require('app/lib/http/compiler');

let resolverConfDir;
let Markconf;

const keyType = ref => {
	return Array.isArray(ref) ? '_array' : `_${typeof ref}`;
};

const resolver = {
	_function: elem => new Promise(resolve => {
		resolve(elem);
	}),

	_string: (name, type, key, def) => new Promise((resolve, reject) => {
		let pluginExpObj;
		let localName;
		const errors = [];

		try {
			pluginExpObj = require(name);
		} catch (err) {
			errors.push(err.toString());

			try {
				localName = path.join(resolverConfDir, name);
				pluginExpObj = require(localName);
			} catch (err) {
				errors.push(err.toString());
				errors.forEach(err => {
					log.error(err.toString());
				});
				reject(err);
			}
		}

		// this could be handler by the plugin verifier in the future
		if (typeof pluginExpObj !== 'object') {
			return reject(`Plugin definition for ${log.ul(name)} was not returned as an object!`);
		}

		if (!Reflect.has(pluginExpObj, 'name')) {
			return reject(`Plugin export for ${log.ul(name)} did not have a name!`);
		}

		if (!Reflect.has(pluginExpObj, 'plugin') &&
			typeof pluginExpObj.plugin === 'function') {
			return reject(`Plugin export for ${log.ul(name)} did not have a plugin callback!`);
		}

		if (!def) {
			const plugin = registry.register(localName || name, key, type);
			return resolve(plugin);
		}

		if (type === 'modifier') {
			const plugin = registry.register(localName || name, key, type);

			if (Reflect.has(def, 'options')) {
				plugin.setOptions(def.options);
			}

			if (Reflect.has(def, 'template')) {
				plugin.setMarkconfTemplatePath(def.template)
				.then(() => {
					resolve(plugin);
				}).catch(reject);
				return;
			}

			return resolve(plugin);
		}
	}),

	_object: (item, type, key) => new Promise((resolve, reject) => {
		if ({}.hasOwnProperty.call(item, 'module') === false) {
			log.error(`Plugin object for ${log.hl(JSON.stringify(item))} should have a module property.`);
			return reject(false);
		}

		resolver._string(item.module, type, key, item).then(resolve).catch(reject);
	}),

	_array: (elem, type, key) => new Promise((resolve, reject) => {
		const promises = elem.map(item => {
			return resolver[keyType(item)](item, type, key);
		});

		Promise.all(promises).then(results => {
			resolve(results);
		}).catch(err => {
			reject(err);
		});
	})
};

const resolveConf = (conf, type) => new Promise((resolve, reject) => {
	const promises = [];

	Reflect.ownKeys(conf).forEach(key => {
		const elem = conf[key];
		promises.push(resolver[keyType(elem)](elem, type, key));
	});

	Promise.all(promises).then(results => {
		const liveConf = {};

		Reflect.ownKeys(conf).forEach((key, index) => {
			liveConf[key] = results[index];
		});

		resolve(liveConf);
	}).catch(err => {
		reject(err);
	});
});

module.exports = (confPath, conf) => new Promise((resolve, reject) => {
	registry.configure(conf);

	const providedPath = confPath.split('Markconf.js')[0];
	const confDir = path.resolve(providedPath);

	// use in the resolver to load local plugins
	resolverConfDir = confDir;

	const confFile = path.resolve(path.join(confDir, 'Markconf.js'));
	log.trace('Resolving Markconf for path: ' + log.ul(confFile));

	let error;

	try {
		Markconf = require(confFile);
	} catch (err) {
		error = err;
		Markconf = false;
	}

	if (Markconf) {
		log.trace('Markconf ' + log.ul(confFile) + ' loaded successfully.');
		log.trace(Markconf);

		if (!Reflect.has(Markconf, 'includers')) {
			compiler.configure(Markconf, null);
		}

		const pluginStack = {};

		if (Reflect.has(Markconf, 'includers')) {
			resolveConf(Markconf.includers, 'includer')
			.then(plugins => {
				compiler.configure(Markconf, plugins);
				pluginStack.includers = plugins;
				if (Reflect.has(Markconf, 'modifiers')) {
					resolveConf(Markconf.modifiers, 'modifier')
					.then(plugins => {
						pluginStack.modifiers = plugins;
						resolve(pluginStack);
					}).catch(reject);
				} else {
					resolve(pluginStack);
				}
			}).catch(reject);
		} else if (Reflect.has(Markconf, 'modifiers')) {
			resolveConf(Markconf.modifiers, 'modifier')
			.then(plugins => {
				pluginStack.modifiers = plugins;
				resolve(pluginStack);
			}).catch(reject);
		} else {
			const msg = `Plugins were not found in the ${log.hl('Markconf.js')} file.`;
			log.error(msg);
			reject(msg);
		}

		return;
	}

	log.error('Markconf ' + log.ul(confFile) + ' could not be loaded!');
	return error;
});
