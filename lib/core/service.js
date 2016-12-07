const Promise = require('bluebird');

const log = require('app/lib/core/log');
const requests = require('app/lib/http/requests');
const server = require('app/lib/http/server');

const service = config => new Promise((resolve, reject) => {
	log.trace('Starting The Markserv Service.');

	const service = Object.assign({}, config, {
		initialized: false,
		helpers: require('app/lib/help/internal')(config)
	}, require('app/lib/help/external')(config));

	// We send the service to the compiler so it can use the helper functions
	config.compiler.setConfig(service);

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
				promises.push(plugin.configure(service));
			} else if (definitionType === 'array') {
				for (const subPlug of plugin) {
					promises.push(subPlug.configure(service));
				}
			}
		}

		Promise.all(promises).then(() => {
			resolve();
		}).catch(err => {
			reject(err);
		});
	});

	const configureType = type => new Promise((resolve, reject) => {
		log.trace('Markserv is configuring plugins....');

		if (!config.plugins) {
			const warn = 'No plugins were found to configure.';
			log.warn(warn);
			return reject(warn);
		}

		if (hasOwnProperty.call(config.plugins, type) === false) {
			const err = 'No ' + log.hl(type) + ' plugins were found to configure.';
			log.warn(err);
			return reject(err);
		}

		const stack = config.plugins[type];

		if (Reflect.ownKeys(stack).length > 0) {
			configureStack(stack, type)
			.then(resolve)
			.catch(reject);
			return;
		}

		const msg = 'No ' + log.hl('modifier') + ' plugins were found to configure.';
		// log.fatal(fatal);
		reject(msg);
	});

	const configurePlugins = () => new Promise((resolve, reject) => {
		const promises = [];

		if (Reflect.has(config.plugins, 'includers')) {
			promises.push(configureType('includers'));
		}

		if (Reflect.has(config.plugins, 'modifiers')) {
			promises.push(configureType('modifiers'));
		}

		return Promise.all(promises).then(() => {
			resolve(service);
		}).catch(reject);
	});

	const startServer = service => new Promise((resolve, reject) => {
		log.trace('Starting HTTP Server.');

		const requestHandler = requests(config);

		server(config)
		.start(requestHandler)
		.then(() => {
			log.trace('Markserv HTTP Server started successfully.');
			require('app/lib/core/shutdown')(process);
			service.initialized = true;
			resolve(service);
		}).catch(err => {
			log.error('Failed to start Markserv HTTP Server!');
			reject(err);
		});
	});

	service.shutdown = service => {
		if ({}.hasOwnProperty.call(service, 'httpServer')) {
			service.httpServer.shutdown(); // thenable?
		}
		return service;
	};

	return startServer(service)
	.then(configurePlugins)
	.then(resolve)
	.catch(err => {
		console.log(err);
		log.error('Could not start Markserv service!');
		log.error(err);
		reject(err);
	});
});

module.exports = service;
