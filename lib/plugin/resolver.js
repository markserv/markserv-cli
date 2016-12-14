const path = require('path');

const log = require('app/lib/core/log');
const helpers = require('app/lib/help/internal');
const compiler = require('app/lib/http/compiler');
const modifier = require('app/lib/plugin/modifier');
const includer = require('app/lib/plugin/includer');

module.exports = config => {
	config.helpers = helpers(config);
	// const registry = register(config);

	const createIncluder = includer(config);
	const createModifier = modifier(config);

	const createPlugin = {
		includer: createIncluder,
		modifier: createModifier
	};

	const keyType = ref => {
		return Array.isArray(ref) ? '_array' : `_${typeof ref}`;
	};

	let subplug;
	let subserv;

	const resolver = {
		_import: (type, key) => {
			if (typeof subplug === 'object' &&
				typeof subplug[type + 's'] === 'object' &&
				typeof subplug[type + 's'][key] === 'object') {
				const subPlugin = subplug[type + 's'][key];
				return subPlugin;
			}

			const msg = `Could not import sub-Markconf plugin: ${log.hl(type)} > ${log.hl(key)}.`;
			log.error(msg);
		},

		_function: elem => new Promise(resolve => {
			resolve(elem);
		}),

		_string: (name, type, key, def) => new Promise((resolve, reject) => {
			const errors = [];
			let pluginExpObj;
			let subPlugin;

			try {
				pluginExpObj = require(name);
			} catch (err) {
				errors.push(err.toString());

				try {
					name = path.join(config.MarkconfDir, name);
					pluginExpObj = require(name);
				} catch (err) {
					errors.push(err.toString());

					try {
						name = name.split(config.MarkconfDir + path.sep)[1];
						if (name === '@import') {
							subPlugin = resolver._import(type, key);
							name = subPlugin.name;
							pluginExpObj = require(name);
						}
					} catch (err) {
						errors.push(err.toString());

						errors.forEach(err => {
							log.error(err.toString());
						});
						reject(err);
					}
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

			const pluginDir = path.dirname(require.resolve(name));

			if (!def) {
				const plugin = createPlugin[type]([key, pluginDir, pluginExpObj]);
				resolve(plugin);
			}

			if (type === 'modifier') {
				const plugin = createPlugin[type]([key, pluginDir, pluginExpObj]);

				// if (subPlugin) {
				// 	plugin.setSubPlugin(subPlugin);
				// }

				if (Reflect.has(def, 'options')) {
					plugin.setOptions(def.options);
				}

				if (Reflect.has(def, 'template')) {
					plugin.setConfigTemplate(def.template);
				}

				if (Reflect.has(def, 'templateUrl')) {
					plugin.setConfigTemplateUrl(def.templateUrl);
				}

				resolve(plugin);
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

	const resolvePlugins = config => new Promise((resolve, reject) => {
		log.trace(`Resolving plugins for Markconf ${log.ul(config.MarkconfUrl)}.`);

		const plugins = {};

		config.compiler = compiler.init();

		if (Reflect.has(config.MarkconfJs, 'includers') &&
			Reflect.has(config.MarkconfJs, 'modifiers')) {
			resolveConf(config.MarkconfJs.includers, 'includer')
			.then(includerPlugins => {
				config.compiler.setIncluders(includerPlugins);
				plugins.includers = includerPlugins;
				resolveConf(config.MarkconfJs.modifiers, 'modifier')
				.then(modifierPlugins => {
					plugins.modifiers = modifierPlugins;
					config.plugins = plugins;
					resolve(config);
				})
				.catch(reject);
			})
			.catch(reject);
		} else if (!Reflect.has(config.MarkconfJs, 'includers') &&
			Reflect.has(config.MarkconfJs, 'modifiers')) {
			resolveConf(config.MarkconfJs.modifiers, 'modifier')
			.then(modifierPlugins => {
				plugins.modifiers = modifierPlugins;
				config.plugins = plugins;
				resolve(config);
			}).catch(reject);
		} else {
			const msg = `Plugins were not found in the Markconf file: ${log.ul(config.MarkconfUrl)}.`;
			log.error(msg);
			reject(msg);
		}
	});

	return new Promise((resolve, reject) => {
		if (Reflect.has(config.MarkconfJs, 'import')) {
			const subMarkconfFile = path.join('node_modules', config.MarkconfJs.import, 'Markconf.js');
			const subMarkconf = path.resolve(subMarkconfFile);

			log.trace(`${log.hl('Import')} > Markconf.js ${log.ul(config.MarkconfUrl)} imports ${log.ul(subMarkconfFile)}.`);

			const subArgs = [
				null, null,
				'-c', subMarkconf,
				'-l', log.getLevel()
			];

			config.initialize(subArgs, {subconf: true})
			.then(subMarkservService => {
				// console.log(subMarkservService);
				subplug = subMarkservService.plugins;
				subserv = subMarkservService;
				subMarkservService.$ops.subconf = false;
				// resolve(subMarkservService);

				resolvePlugins(config).then(plugins => {
					resolve(plugins);
				}).catch(reject);
			})
			.catch(err => {
				log.error(`${log.hl('Import Failed')} > for: ${log.ul(subMarkconfFile)}.`);
				reject(err);
			});
		} else {
			resolvePlugins(config).then(resolve).catch(reject);
		}
	});
};
