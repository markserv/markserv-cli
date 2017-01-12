const path = require('path');

const log = require('app/lib/core/log');
const helpers = require('app/lib/help/internal');
const compiler = require('app/lib/http/compiler');
const modifier = require('app/lib/plugin/modifier');
const includer = require('app/lib/plugin/includer');

module.exports = config => {
	log.trace(`Boot-strapping the Markserv service for: ${log.ul(config.MarkconfUrl)}.`);

	config.helpers = helpers(config);

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

	const resolver = {
		_import: (type, key) => {
			log.trace(`⇠  ${type} ${log.red('IMPORT')} ${log.hl(key)}.`);

			if (typeof subplug === 'object' &&
				typeof subplug[type + 's'] === 'object' &&
				typeof subplug[type + 's'][key] === 'object') {
				const subPlugin = subplug[type + 's'][key];
				return subPlugin;
			}

			const msg = `Could not import sub-Markconf plugin: ${log.hl(type)} > ${log.hl(key)}.`;
			log.error(msg);
		},

		_function: (elem, type) => new Promise(resolve => {
			log.trace(`⇠  ${type} ${log.red('FUNCTION')} ${log.hl(elem)}.`);
			resolve(elem);
		}),

		_string: (name, type, key, def) => new Promise((resolve, reject) => {
			log.trace(`⇠  ${type} ${log.red('STRING')} ${log.hl(name)}.`);

			const errors = [];
			let pluginExpObj;
			let subPlugin;

			try {
				pluginExpObj = require(name);
				log.trace(`Module: ${log.ul(name)} loaded.`);
			} catch (err) {
				errors.push(err.toString());

				try {
					name = path.join(config.MarkconfDir, name);
					pluginExpObj = require(name);
					log.trace(`Module: ${log.ul(name)} loaded.`);
				} catch (err) {
					errors.push(err.toString());

					try {
						name = path.join(config.MarkconfDir, 'node_modules', name);
						pluginExpObj = require(name);
						log.trace(`Module: ${log.ul(name)} loaded.`);
					} catch (err) {
						errors.push(err.toString());

						try {
							name = name.split(config.MarkconfDir + path.sep)[1];

							// eslint-disable-next-line max-depth
							if (name === '@import') {
								subPlugin = resolver._import(type, key);
								name = subPlugin.name;
								pluginExpObj = require(name);
								log.trace(`Module: ${log.ul(name)} loaded.`);
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
			}

			if (typeof pluginExpObj !== 'object') {
				log.error(`Could not load plugin: ${log.hl(name)}.`);
				return reject(`Plugin definition for ${log.ul(name)} was not returned as an object!`);
			}

			if (!Reflect.has(pluginExpObj, 'name')) {
				log.error(`Could not load plugin: ${log.hl(name)}.`);
				return reject(`Plugin export for ${log.ul(name)} did not have a name!`);
			}

			if (!Reflect.has(pluginExpObj, 'plugin') &&
				typeof pluginExpObj.plugin === 'function') {
				log.error(`Could not load plugin: ${log.hl(name)}.`);
				return reject(`Plugin export for ${log.ul(name)} did not have a plugin callback!`);
			}

			const pluginDir = path.dirname(require.resolve(name));

			log.trace(`Registering ${log.ul(type)} plugin: ${log.ul(name)}.`);

			if (!def) {
				const plugin = createPlugin[type]([key, pluginDir, pluginExpObj]);
				resolve(plugin);
			}

			if (type === 'modifier') {
				const plugin = createPlugin[type]([key, pluginDir, pluginExpObj]);

				if (subPlugin) {
					plugin.setSubPlugin(subPlugin);
				}

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
			log.trace(`⇠  ${type} ${log.red('OBJECT')} ${log.hl(key)}.`);

			if (!Reflect.has(item, 'module')) {
				log.error(`Plugin object for ${log.hl(JSON.stringify(item))} should have a module property.`);
				return reject(false);
			}

			return resolver._string(item.module, type, key, item).then(resolve).catch(reject);
		}),

		_array: (elem, type, key) => new Promise((resolve, reject) => {
			log.trace(`⇠  ${type} ${log.red('ARRAY')} ${log.hl(key)}.`);

			const promises = elem.map(item => {
				log.trace(`Registering ${log.ul(type)} plugin: ${log.ul(key)}.`);
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
		log.trace(`Resolving ${log.hl(type)} plugins....`);
		const promises = [];

		Reflect.ownKeys(conf).forEach(key => {
			log.trace(`Found plugin for: ${log.hl(key)}`);
			const elem = conf[key];
			promises.push(resolver[keyType(elem)](elem, type, key));
		});

		Promise.all(promises).then(results => {
			log.trace(`All ${log.hl(type)} plugins resolved.`);
			const liveConf = {};

			Reflect.ownKeys(conf).forEach((key, index) => {
				log.trace(`Adding ${log.hl(results[index].name)} plugin for pattern: ${log.hl(key)} to Markserv service.`);
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
				log.trace(`Resolved ${log.hl('includer')} plugins for Markconf ${log.ul(config.MarkconfUrl)}.`);
				config.compiler.setIncluders(includerPlugins);
				plugins.includers = includerPlugins;
				resolveConf(config.MarkconfJs.modifiers, 'modifier')
				.then(modifierPlugins => {
					log.trace(`Resolved ${log.hl('modifier')} plugins for Markconf ${log.ul(config.MarkconfUrl)}.`);
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
				log.trace(`Resolved ${log.hl('modifier')} plugins for Markconf ${log.ul(config.MarkconfUrl)}.`);
				plugins.includers = {};
				plugins.modifiers = modifierPlugins;
				config.plugins = plugins;
				resolve(config);
			}).catch(reject);
		} else {
			const msg = `Plugins were not found in the Markconf file: ${log.ul(config.MarkconfUrl)}.`;
			log.warn(msg);

			config.plugins = {
				includers: {},
				modifiers: {}
			};

			resolve(config);
		}
	});

	return new Promise((resolve, reject) => {
		if (Reflect.has(config.MarkconfJs, 'import')) {
			const subMarkconfFile = path.join(config.MarkconfDir, 'node_modules', config.MarkconfJs.import, 'Markconf.js');
			const subMarkconf = path.resolve(subMarkconfFile);

			log.trace(`${log.hl('Import')} > Markconf.js ${log.ul(config.MarkconfUrl)} imports ${log.ul(subMarkconfFile)}.`);

			const subArgs = [
				null, null,
				'-c', subMarkconf,
				'-l', log.getLevel()
			];

			log.trace(`Initializing sub-service for ${log.hl('IMPORT')}: ${log.ul(subMarkconfFile)}.`);
			config.initialize(subArgs, {parent: config})
			.then(subMarkservService => {
				log.trace(`Sub-service successfully innitialized for ${log.hl('IMPORT')}: ${log.ul(subMarkconfFile)}.`);
				subplug = subMarkservService.plugins;

				// Set the parent so that imported plugins can inherit overrides
				subMarkservService.parent = config;

				// Set the subconf so that the request handler can lookup impoted plugins
				config.subconf = subMarkservService;

				// Turn the subconf flag off so that the outer httpServer starts
				subMarkservService.$ops.subconf = false;
				resolvePlugins(config).then(resolve).catch(reject);
			})
			.catch(err => {
				log.error(`${log.hl('Import Failed')} > for: ${log.ul(subMarkconfFile)}.`);
				reject(err);
			});
		} else {
			resolvePlugins(config).then(config => {
				log.trace(`Plugins resolved for ${log.ul(config.MarkconfUrl)}.`);

				const includerCount = Reflect.ownKeys(config.plugins.includers).length;
				const modifierCount = Reflect.ownKeys(config.plugins.modifiers).length;
				const pluginCount = includerCount + modifierCount;

				if (pluginCount < 1) {
					const msg = `${log.hl('No plugins loaded!')}: ${log.ul(config.MarkconfUrl)}.`;
					log.error(msg);
					reject(msg);
				}

				resolve(config);
			}).catch(reject);
		}
	});
};
