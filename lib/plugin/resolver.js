const path = require('path');

const log = require('app/lib/core/log');
const helpers = require('app/lib/help/internal');
const compiler = require('app/lib/http/compiler');
const modifier = require('app/lib/plugin/modifier');
const includer = require('app/lib/plugin/includer');

// Returns error detail for modules that failed on require()
const fileFailPattern = 'at Object.<anonymous> (';

const getFailDetail = err => {
	const stack = err.stack.split('\n');
	let file;
	let row;
	let col;

	stack.forEach(stackLine => {
		let val = stackLine;

		if (stackLine.indexOf('    ') === 0) {
			val = stackLine.substr(4);
		}

		if (!file) {
			if (stackLine.indexOf(fileFailPattern)) {
				let fileRef = stackLine.split(fileFailPattern)[1];

				if (fileRef) {
					fileRef = fileRef.split(')')[0];

					let divider = fileRef.lastIndexOf(':');
					col = parseInt(fileRef.substr(divider + 1), 10);
					fileRef = fileRef.substr(0, divider);

					divider = fileRef.lastIndexOf(':');
					row = parseInt(fileRef.substr(divider + 1), 10);
					file = fileRef.substr(0, divider);
				}
			}
		}

		return val;
	});

	const detail = {
		file,
		row,
		col
	};

	return detail;
};

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

	const pluginList = [];
	const templateList = [];

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

			let pluginExpObj;
			let subPlugin;

			const errors = [];

			const captureErr = (err, requireRef) => {
				const bypass = err.code !== 'MODULE_NOT_FOUND';

				const errorDetail = {
					index: errors.length,
					message: err.message,
					stack: err.stack,
					code: err.code,
					name: err.name,
					requireRef,
					bypass
				};

				if (bypass) {
					const failDetail = getFailDetail(err);
					errorDetail.file = failDetail.file;
					errorDetail.row = failDetail.row;
					errorDetail.col = failDetail.col;
				}

				errors.push(errorDetail);

				return errorDetail;
			};

			const REQ = {
				normal: name => {
					try {
						pluginExpObj = require(name);

						log.trace(`Module: ${log.ul(name)} loaded.`);
						return name;
					} catch (err) {
						const error = captureErr(err, name);

						if (error.bypass) {
							return error;
						}

						return REQ.local(name);
					}
				},

				local: name => {
					const localName = path.join(config.MarkconfDir, name);

					try {
						pluginExpObj = require(localName);

						log.trace(`Module: ${log.ul(name)} loaded.`);
						return localName;
					} catch (err) {
						const error = captureErr(err, localName);

						if (error.bypass) {
							return error;
						}

						return REQ.nodeModules(name);
					}
				},

				nodeModules: name => {
					try {
						name = path.join(config.MarkconfDir, 'node_modules', name);
						pluginExpObj = require(name);

						log.trace(`Module: ${log.ul(name)} loaded.`);
						return name;
					} catch (err) {
						const error = captureErr(err, name);

						if (error.bypass) {
							return error;
						}

						return REQ.local(name);
					}
				},

				import: name => {
					try {
						if (name === '@import') {
							subPlugin = resolver._import(type, key);
							name = subPlugin.name;

							pluginExpObj = require(name);

							log.trace(`Module: ${log.ul(name)} loaded.`);
							return name;
						}

						const errorMsg = `Could not load plugin: ${log.ul(name)}`;
						log.error(errorMsg);
						throw new Error(errorMsg);
					} catch (err) {
						const error = captureErr(err, name);

						if (error.bypass) {
							return error;
						}

						return REQ.otherwise();
					}
				},

				otherwise: () => {
					log.error(errors[errors.length].stack.split('\n')[0]);
				}
			};

			const requireResult = REQ.normal(name);

			if (typeof requireResult === 'string') {
				name = requireResult;
			} else {
				const err = requireResult;
				log.error(`${log.hl(err.name)} in plugin ${log.ul(err.file + ':' + err.row + ':' + err.col)}`);
				name = err.file;
			}

			if (pluginExpObj === undefined) {
				const fauxplug = {
					name: 'pluginPlaceholder',
					plugin: () => {}
				};

				pluginExpObj = fauxplug;
			}

			if (typeof pluginExpObj !== 'object') {
				log.error(`Plugin definition for ${log.ul(name)} was not returned as an object!`);
			}

			if (!Reflect.has(pluginExpObj, 'name')) {
				log.error(`Plugin export for ${log.ul(name)} did not have a name!`);
			}

			if (!Reflect.has(pluginExpObj, 'plugin') &&
				typeof pluginExpObj.plugin === 'function') {
				log.error(`Plugin export for ${log.ul(name)} did not have a plugin callback!`);
			}

			let resolvedPluginScript;

			if (pluginExpObj.name === 'pluginPlaceholder') {
				resolvedPluginScript = name;
			} else {
				resolvedPluginScript = require.resolve(name);
			}

			pluginList.push(resolvedPluginScript);

			const pluginDir = path.dirname(resolvedPluginScript);

			log.trace(`Registering ${log.ul(type)} plugin: ${log.ul(name)}.`);

			if (!def) {
				const plugin = createPlugin[type]([key, pluginDir, pluginExpObj]);
				return resolve(plugin);
			}

			const addWatchTemplate = templatePath => {
				if (templateList.indexOf(templatePath) === -1) {
					templateList.push(templatePath);
				}
			};

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

					const templatePath = path.join(config.MarkconfDir, def.templateUrl);
					addWatchTemplate(templatePath);
				}

				if (Reflect.has(pluginExpObj, 'templateUrl')) {
					const templatePath = path.join(pluginDir, pluginExpObj.templateUrl);
					addWatchTemplate(templatePath);
				}

				return resolve(plugin);
			}

			const plugin = createPlugin[type]([key, pluginDir, pluginExpObj]);
			return resolve(plugin);
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
					config.pluginList = pluginList;
					config.templateList = templateList;
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
				config.pluginList = pluginList;
				config.templateList = templateList;
				resolve(config);
			}).catch(reject);
		} else {
			const msg = `Plugins were not found in the Markconf file: ${log.ul(config.MarkconfUrl)}.`;
			log.warn(msg);

			config.plugins = {
				includers: {},
				modifiers: {}
			};

			config.pluginList = pluginList;
			config.templateList = templateList;

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
				resolvePlugins(config).then(finalConfig => {
					// Concat the plugins/templates for watch
					finalConfig.pluginList = subMarkservService.pluginList.concat(pluginList);
					finalConfig.templateList = subMarkservService.templateList.concat(templateList);

					resolve(finalConfig);
				}).catch(reject);
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
