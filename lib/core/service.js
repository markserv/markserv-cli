const path = require('path');
const fs = require('fs');

const _Promise = require('bluebird');
const minimatch = require('minimatch');
const deepEqual = require('deep-equal');
const openporthost = require('open-port-host');

const log = require('app/lib/core/log');
const server = require('app/lib/http/server');
const watch = require('app/lib/core/watch');
const sync = require('app/lib/core/sync');

let syncConfig = {};
let lastSyncConfig = {};
let reservedAddresses = [];
let httpServer;

const service = config => new Promise((resolve, reject) => {
	log.trace('Starting The Markserv Service.');

	const shutdown = (markservService, callback) => {
		if (typeof markservService.httpServer === 'object') {
			httpServer.shutdown();

			if (typeof callback !== 'function') {
				return markservService;
			}

			setTimeout(() => {
				markservService.pluginList.forEach(module => {
					log.trace(`Unload plugin: ${log.ul(module)}`);
					delete require.cache[module];
				});

				log.trace(`Unloading Markconf: ${log.ul(markservService.MarkconfUrl)}`);
				delete require.cache[markservService.MarkconfUrl];

				let subMarkconfUrl;
				if (typeof markservService.subconf === 'object') {
					subMarkconfUrl = markservService.MarkconfUrl ? config.subconf.MarkconfUrl : false;
					log.trace(`Unloading sub-Markconf: ${log.ul(subMarkconfUrl)}`);
					delete require.cache[subMarkconfUrl];
				}

				reservedAddresses = [];
				httpServer = null;

				callback();
			}, 0);
		} else {
			console.eror('oh no');
		}

		return markservService;
	};

	//           /*** internal markserv service
	// config ***
	//           \*** external plugin service

	// Fork the config into internal and external (plugin) services
	// `markservService` is used by the app to setup, run and test.
	// It is passed back to the init function.

	const markservService = Object.assign({}, config, {
		initialized: false,
		helpers: require('app/lib/help/internal')(config),
		overrides: config.MarkconfJs.overrides || {},
		shutdown
	});

	// We send the service to the compiler so it can use the helper functions
	config.compiler.setConfig(markservService);

	const externalHelpers = require('app/lib/help/external')(config);

	// `pluginService` is used for plugin operation only and contains the
	// minimum set of properties needed for operation. It is passed into the
	// plugin.configure function and is not returned back to init.
	const pluginService = Object.assign({}, {
		// The original Markconf.js file exports
		MarkconfJs: config.MarkconfJs,

		// Path to the Markconf.js file (used by plugins to load templates)
		MarkconfDir: config.MarkconfDir,

		// Url of the active Markconf file
		MarkconfUrl: config.MarkconfUrl,

		// The Root directory to serve files
		root: config.root,

		// Current Helper API
		helpers: externalHelpers,

		// Logging
		log: require('app/lib/core/log'),

		// The compiler service
		compiler: markservService.compiler

		// Future Helper API can be extended and tested here before switchover
		// helpersv2: externalHelpersV2
	});

	const configureStack = stack => new Promise((resolve, reject) => {
		const promises = [];

		for (const pluginName in stack) {
			if (!Reflect.has(stack, pluginName)) {
				continue;
			}

			log.trace(`Configuring plugin: ${log.hl(pluginName)}`);

			const plugin = stack[pluginName];
			const definitionType = Array.isArray(plugin) ? 'array' : 'object';

			if (definitionType === 'object') {
				promises.push(plugin.configure(pluginService));
			} else if (definitionType === 'array') {
				for (const subPlug of plugin) {
					promises.push(subPlug.configure(pluginService));
				}
			}
		}

		if (promises.length === 0) {
			resolve();
		}

		_Promise.all(promises).then(() => {
			resolve();
		}).catch(err => {
			reject(err);
		});
	});

	const configureType = type => new Promise((resolve, reject) => {
		log.trace('Markserv is configuring plugins....');

		if (Reflect.has(config.plugins, type) === false) {
			const msg = `No plugins of type: ${log.hl(type)} were found to configure.`;
			log.warn(msg);
			return reject(msg);
		}

		const stack = config.plugins[type];

		if (Reflect.ownKeys(stack).length > 0) {
			configureStack(stack, type)
			.then(() => {
				const successMsg = `${log.hl('Done')} > All plugins of type: ${log.hl(type)} confgured.`;
				resolve(successMsg);
			})
			.catch(reject);
			return;
		}

		resolve(`${log.hl('Done')} > No plugins of type: ${log.hl(type)} needed configuration.`);
	});

	const configurePlugins = () => new Promise((resolve, reject) => {
		if (!Reflect.has(config, 'plugins')) {
			const warn = 'No plugins were found to configure.';
			log.warn(warn);
			return reject(warn);
		}

		const promises = [];

		if (Reflect.has(config.plugins, 'includers')) {
			promises.push(configureType('includers'));
		}

		if (Reflect.has(config.plugins, 'modifiers')) {
			promises.push(configureType('modifiers'));
		}

		if (promises.length === 0) {
			return resolve(service);
		}

		_Promise.some(promises, promises.length).spread(() => {
			// log.trace(arguments[0]); // includers
			// log.trace(arguments[0]); // modifiers
			resolve(markservService);
		}).catch(err => {
			reject(err);
		});
	});

	const findOpenPorts = () => new Promise((resolve, reject) => {
		if (reservedAddresses.length > 0) {
			return resolve(reservedAddresses);
		}

		let minMax;
		let portrange;

		if (config.args.port.indexOf('-') > -1) {
			minMax = config.args.port.split('-');
			portrange = [minMax[0], minMax[1]];
		}

		const options = {
			// debug: true,
			start: parseInt(portrange[0], 10),
			end: parseInt(portrange[1], 10),
			count: 2,
			host: config.args.address
		};

		openporthost(options)
		.then(reserved => {
			reservedAddresses = reserved;
			resolve(reserved);
		}).catch(reject);
	});

	const startServer = () => new Promise((resolve, reject) => {
		if (httpServer) {
			log.trace('HTTP Server already started, shutting down.');
			httpServer.shutdown();
		}

		const watchDef = Reflect.has(config.MarkconfJs, 'watch') && config.MarkconfJs.watch;

		log.trace('Starting HTTP Server...');

		// Quit without starting the server if we are only loading a subconf
		if (config.$ops.get('subconf') === true) {
			markservService.initialized = true;
			httpServer = markservService.httpServer;
			return resolve();
		}

		// HTTP server takes the second open port, the first will
		// be taken by the browser sync proxy, unless user specifies
		// no watch section in the Markconf
		let reservedAddress;
		if (watchDef) {
			reservedAddress = reservedAddresses[1];
		} else {
			reservedAddress = reservedAddresses[0];
		}

		server(markservService)
		.start(reservedAddress)
		.then(() => {
			log.info('The HTTP Server was started.');
			if (process.stdin.isTTY) {
				require('app/lib/core/shutdown')(process);
			}
			markservService.initialized = true;
			httpServer = markservService.httpServer;
			resolve(server);
		}).catch(err => {
			log.error('Failed to start Markserv HTTP Server!');
			reject(err);
		});
	});

	const setWatches = () => new Promise(resolve => {
		const watchDef = Reflect.has(config.MarkconfJs, 'watch') && config.MarkconfJs.watch;

		if (!watchDef) {
			log.trace('No watches found in this Markconf.');
			return resolve(null);
		}

		const MarkconfUrl = Reflect.has(watchDef, 'Markconf') ? config.MarkconfUrl : false;

		let subMarkconfUrl;
		if (typeof markservService.subconf === 'object') {
			subMarkconfUrl = MarkconfUrl ? config.subconf.MarkconfUrl : false;
		}

		const plugins = Reflect.has(watchDef, 'plugins') && watchDef.plugins ? markservService.pluginList.concat(markservService.templateList) : false;
		const files = Reflect.has(watchDef, 'files') ? watchDef.files : false;

		const browserSyncProxy = `${config.args.address}:${reservedAddresses[1].port}`;
		const reservedBrowserSyncAddress = reservedAddresses[0];

		console.log(reservedAddresses);

		syncConfig = {
			// logLevel: 'silent',
			logPrefix: 'BrowserSync',
			port: reservedBrowserSyncAddress.port,
			proxy: browserSyncProxy,
			notify: true
			// notify: false
		};

		markservService.browserSync = syncConfig;

		let syncConfigChanged = false;

		if (!deepEqual(syncConfig, lastSyncConfig) &&
			config.$ops.get('subconf') === true) {
			syncConfigChanged = true;
			log.trace('The BrowserSync configuration has changed.');
		}

		lastSyncConfig = syncConfig;

		if (!sync.isActive()) {
			if (syncConfigChanged) {
				sync.stop();
			}

			reservedBrowserSyncAddress.server.once('close', () => {
				sync.start(syncConfig);
			});
			reservedBrowserSyncAddress.server.close();
		}

		const watchList = [];

		const addToWatchList = file => {
			watchList.push(file);
		};

		if (MarkconfUrl) {
			addToWatchList(MarkconfUrl);
		}

		if (subMarkconfUrl) {
			addToWatchList(subMarkconfUrl);
		}

		if (files) {
			files.forEach(file => {
				addToWatchList(path.join(config.root, file));
			});
		}

		if (plugins) {
			plugins.forEach(plugin => {
				addToWatchList(path.join(plugin));
			});
		}

		const restartMarkserv = () => {
			markservService.pluginList.forEach(module => {
				log.trace(`Unload plugin: ${log.ul(module)}`);
				delete require.cache[module];
			});

			if (subMarkconfUrl) {
				log.trace(`Unloading sub-Markconf: ${log.ul(subMarkconfUrl)}`);
				delete require.cache[subMarkconfUrl];
			}

			if (MarkconfUrl) {
				log.trace(`Unloading Markconf: ${log.ul(MarkconfUrl)}`);
				delete require.cache[MarkconfUrl];
			}

			watch.close();

			markservService.initialize()
			.then(() => {
				sync.reload();
			});
		};

		const handleChanges = (changedFile, changeType) => {
			let shortPattern;

			const changed = watchList.some(filePattern => {
				const match = minimatch(changedFile, filePattern, {
					matchBase: true,
					dot: true
				});

				if (!match) {
					return false;
				}

				shortPattern = path.relative(config.root, filePattern);
				return true;
			});

			// Establish type of change and relevant action

			if (plugins && plugins.indexOf(changedFile) > -1) {
				log.info(`Watch: found ${log.hl('plugins')} rule for: ${log.hl(changeType)} ${log.ul(changedFile)}`);
				restartMarkserv(changedFile);
				return;
			} else if (changedFile === MarkconfUrl || changedFile === subMarkconfUrl) {
				log.info(`Watch: found ${log.hl('Markconf')} rule for: ${log.hl(changeType)} ${log.ul(changedFile)}`);
				restartMarkserv(changedFile);
				return;
			}

			if (changed) {
				log.info(`Watch: found ${log.hl('files')} rule ${log.hl(shortPattern)} for: ${log.hl(changeType)} ${log.ul(changedFile)}`);
				sync.reload(changedFile);
			} else {
				log.trace(`Watch: found no rule for: ${log.hl(changeType)} ${log.ul(changedFile)}`);
			}
		};

		let realRoot;
		let realConf;

		try {
			realRoot = fs.realpathSync(config.root);
		} catch (err) {
		}
		try {
			realConf = fs.realpathSync(config.MarkconfDir);
		} catch (err) {
		}

		const relPath = path.relative(realRoot, realConf) + path.sep;
		const isContained = relPath.substr(relPath.length - 3) === '../';

		const watchDirs = [];

		// Only watch one path if all the paths are in the same tree
		if (relPath.length === 1) {
			watchDirs.push(realRoot);
		} else if (isContained) {
			if (realRoot.length <= realConf.length) {
				watchDirs.push(realRoot);
			} else {
				watchDirs.push(realConf);
			}
		} else if (!isContained) {
			watchDirs.push(realRoot);
			watchDirs.push(realConf);
		}

		watch.create(watchDirs, handleChanges);
		resolve(markservService.browserSync);
	});

	const reportActive = () => new Promise(resolve => {
		if (typeof markservService.httpServer !== 'object') {
			return resolve();
		}

		log.endInitialization();

		let serverUrl;

		if (typeof markservService.browserSync === 'object') {
			serverUrl = `http://${config.args.address}:${markservService.browserSync.port}`;
		} else if (Reflect.has(markservService, 'httpServer')) {
			serverUrl = `http://${config.args.address}:${markservService.httpServer.port}`;
		}

		log.info(`Serving content from: ${log.ul(config.root)}`);
		log.info(`Serving at address: ${log.ul(serverUrl)}`);
		log.info(`Process Id: ${config.pid}`);
		log.info(`To exit Markserv: press Ctrl + C twice.`);
		log.info(`To kill Markserv: type "[sudo] kill [-9] ${config.pid}".`);

		resolve();
	});

	return configurePlugins()
	.then(findOpenPorts)
	.then(startServer)
	.then(setWatches)
	.then(reportActive)
	.then(() => {
		log.trace('The Markserv service was initialized.');
		resolve(markservService);
	})
	.catch(err => {
		log.error('Could not initialize Markserv service!');
		log.error(err);
		reject(err);
	});
});

module.exports = service;
