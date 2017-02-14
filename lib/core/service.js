const path = require('path');

const _Promise = require('bluebird');
const liveReloadXL = require('livereload-xl');
const minimatch = require('minimatch');

const log = require('app/lib/core/log');
const server = require('app/lib/http/server');

const service = config => new Promise((resolve, reject) => {
	log.trace('Starting The Markserv Service.');

	const shutdown = markservService => {
		if ({}.hasOwnProperty.call(markservService, 'httpServer')) {
			markservService.httpServer.shutdown(); // thenable?
		}
		return markservService;
	};

	//           /*** internal markserv service
	// config ***
	//           \*** extrernal plugin service

	// Fork the config into interal and extrnal (plugin) services
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

	// `pluginService` is used for plugin opperation only and contains the
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

	const setWatches = markservService => new Promise((resolve, reject) => {
		console.log('setWatches');

		const watch = Reflect.has(config.MarkconfJs, 'watch') && config.MarkconfJs.watch;

		if (!watch) {
			log.debug('No watches found in this Markconf.');
			return resolve(null);
		}

		const liveReloadPort = Reflect.has(watch, 'port') && watch.port || 35729;
		const MarkconfUrl = Reflect.has(watch, 'Markconf') ? config.MarkconfUrl : false;
		const plugins = Reflect.has(watch, 'plugins') ? watch.plugins : false;
		const files = Reflect.has(watch, 'files') ? watch.files : false;

		console.log('--------------------------');
		console.log(watch);
		console.log(liveReloadPort);
		console.log(MarkconfUrl);
		console.log(plugins);
		console.log(files);
		console.log('--------------------------');

		const watchList = [];

		if (MarkconfUrl) {
			watchList.push(MarkconfUrl);
		}

		files.forEach(file => {
			watchList.push(path.join(config.root, file));
		});

		const liveReloadServer = liveReloadXL.createServer({
			port: liveReloadPort
		});

		const handleChanges = changedFile => {
			watchList.forEach(filePattern => {
				const match = minimatch(changedFile, filePattern, {
					matchBase: true,
					dot: true
				});

				if (match) {
					const shortPattern = path.relative(config.root, filePattern);
					log.info(`Watch file change: ${log.ul(changedFile)} matches: ${log.hl(shortPattern)}`);
					liveReloadServer.refresh(changedFile);
				}
			});
		};

		liveReloadServer.watch(watchList, handleChanges);

		markservService.watch = {
			liveReloadPort,
			liveReloadServer
		};

		resolve(true);
		return;
	});

	const startServer = () => new Promise((resolve, reject) => {
		log.trace('Starting HTTP Server.');

		// Quit without starting the server if we are only loading a subconf
		if (config.$ops.get('subconf') === true) {
			markservService.initialized = true;
			return resolve();
		}

		server(markservService).start()
		.then(() => {
			log.trace('Markserv HTTP Server started successfully.');
			if (process.stdin.isTTY) {
				require('app/lib/core/shutdown')(process);
			}
			markservService.initialized = true;
			resolve();
		}).catch(err => {
			log.error('Failed to start Markserv HTTP Server!');
			reject(err);
		});
	});
	return configurePlugins()
	.then(setWatches)
	.then(startServer)
	.then(() => {
		resolve(markservService);
	})
	.catch(err => {
		log.error('Could not start Markserv service!');
		log.error(err);
		reject(err);
	});
});

module.exports = service;
