const _Promise = require('bluebird');

const log = require('app/lib/core/log');
const requests = require('app/lib/http/requests');
const server = require('app/lib/http/server');

const service = config => new Promise((resolve, reject) => {
	log.trace('Starting The Markserv Service.');

	const shutdown = markservService => {
		if ({}.hasOwnProperty.call(markservService, 'httpServer')) {
			markservService.httpServer.shutdown(); // thenable?
		}
		return markservService;
	};

	// const service = Object.assign({}, config, {
	// 	initialized: false,
	// 	helpers: require('app/lib/help/internal')(config)
	// }, require('app/lib/help/external')(config));

	// Fork the config into interal and extrnal (plugin) services
	// `markservService` is used by the app to setup, run and test.
	// It is passed back to the init function.

	const markservService = Object.assign({}, config, {
		initialized: false,
		helpers: require('app/lib/help/internal')(config),
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

		// The Root directory to serve files
		root: config.root,

		// Current Helper API
		helpers: externalHelpers,

		compiler: markservService.compiler

		// Future Helper API
		// helpersv2: externalHelpersV2
	});

	// console.log(pluginService);

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

		_Promise.some(promises, promises.length).spread((includers, modifiers) => {
			log.trace(includers);
			log.trace(modifiers);
			resolve(markservService);
		}).catch(err => {
			reject(err);
		});
	});

	const startServer = markservService => new Promise((resolve, reject) => {
		log.trace('Starting HTTP Server.');

		const requestHandler = requests(config);

		server(markservService)
		.start(requestHandler)
		.then(() => {
			log.trace('Markserv HTTP Server started successfully.');
			require('app/lib/core/shutdown')(process);
			markservService.initialized = true;
			resolve(markservService);
		}).catch(err => {
			log.error('Failed to start Markserv HTTP Server!');
			reject(err);
		});
	});

	return startServer(markservService)
	.then(configurePlugins)
	.then(resolve)
	.catch(err => {
		log.error('Could not start Markserv service!');
		log.error(err);
		reject(err);
	});
});

module.exports = service;
