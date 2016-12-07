const path = require('path');

const log = require('app/lib/core/log');
const compiler = require('app/lib/http/compiler');
const register = require('app/lib/plugin/register');

module.exports = config => {
	const registry = register(config);

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
					name = path.join(config.MarkconfDir, name);
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
				const plugin = registry.register(name, key, type);
				return plugin.configure(config.MarkconfJs).then(resolve).catch(reject);
			}

			if (type === 'modifier') {
				const plugin = registry.register(name, key, type);

				if (Reflect.has(def, 'options')) {
					plugin.setOptions(def.options);
				}

				if (Reflect.has(def, 'template')) {
					plugin.setMarkconfTemplate(def.template);
				}

				if (Reflect.has(def, 'templateUrl')) {
					plugin.setMarkconfTemplateUrl(def.templateUrl);
				}

				return plugin.configure(config.MarkconfJs).then(resolve).catch(reject);
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

	return new Promise((resolve, reject) => {
		log.trace(`Resolving plugins for Markconf ${log.ul(config.MarkconfJs.MarkconfUrl)}.`);
		log.trace(config.Markconf);

		if (!Reflect.has(config.MarkconfJs, 'includers')) {
			compiler.configure(config.Markconf, null);
		}

		const pluginStack = {};

		if (Reflect.has(config.MarkconfJs, 'includers') &&
			Reflect.has(config.MarkconfJs, 'modifiers')) {
			resolveConf(config.MarkconfJs.includers, 'includer')
			.then(plugins => {
				compiler.configure(config.MarkconfJs, plugins);
				pluginStack.includers = plugins;
				resolveConf(config.MarkconfJs.modifiers, 'modifier')
				.then(plugins => {
					pluginStack.modifiers = plugins;
					config.plugins = pluginStack;
					resolve(config);
				})
				.catch(reject);
			})
			.catch(reject);
		} else if (!Reflect.has(config.MarkconfJs, 'includers') &&
			Reflect.has(config.MarkconfJs, 'modifiers')) {
			resolveConf(config.MarkconfJs.modifiers, 'modifier')
			.then(plugins => {
				pluginStack.modifiers = plugins;
				config.MarkconfJs.plugins = pluginStack;
				resolve(config);
			}).catch(reject);
		} else {
			const msg = `Plugins were not found in the ${log.hl('Markconf.js')} file.`;
			log.error(msg);
			reject(msg);
		}
	});
};
