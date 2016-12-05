// const path = require('path');
const Promise = require('bluebird');

const log = require('app/lib/core/log');
const plugin = require('app/lib/plugin/register');
const help = require('app/lib/help/plugins');

const requests = require('app/lib/http/requests');
const server = require('app/lib/http/server');
const compiler = require('app/lib/http/compiler');
const modifier = require('app/lib/plugin/modifier');

require('app/lib/core/shutdown')(process);

const configureStack = (stack, Markconf) => new Promise((resolve, reject) => {
	const promises = [];

	for (const pluginName in stack) {
		if (!Reflect.has(stack, pluginName)) {
			continue;
		}

		log.trace(`Configuring plugin: ${log.hl(pluginName)}`);

		const plugin = stack[pluginName];
		const definitionType = Array.isArray(plugin) ? 'array' : 'object';

		if (definitionType === 'object') {
			promises.push(plugin.configure(Markconf));
		} else if (definitionType === 'array') {
			for (const subPlug of plugin) {
				promises.push(subPlug.configure(Markconf));
			}
		}
	}

	Promise.all(promises).then(() => {
		resolve();
	}).catch(err => {
		reject(err);
	});
});

const configurePlugins = (Markconf, plugins, type) => new Promise((resolve, reject) => {
	log.trace('Markserv is configuring plugins....');

	if (!plugins) {
		const warn = 'No plugins were found to configure.';
		log.warn(warn);
		return reject(warn);
	}

	if ({}.hasOwnProperty.call(plugins, type) === false) {
		const err = 'No ' + log.hl(type) + ' plugins were found to configure.';
		log.warn(err);
		return reject(err);
	}

	const stack = plugins[type];

	if (Reflect.ownKeys(stack).length > 0) {
		configureStack(stack, Markconf, type)
		.then(resolve)
		.catch(reject);
		return;
	}

	const fatal = 'No ' + log.hl('modifier') + ' plugins were found to configure.';
	log.fatal(fatal);
	reject(fatal);
});

const spawnService = (Markconf, plugins) => new Promise(resolve => {
	let activeServer;
	let activeRequestHandler;

	const configure = service => new Promise((resolve, reject) => {
		log.trace('Markserv service received new configuration.');

		// Templates MUST be loaded before modifiers!
		configurePlugins(Markconf, plugins, 'includers').then(() => {
			configurePlugins(Markconf, plugins, 'modifiers').then(() => {
				log.trace('Markserv finished configuring plugins.');
				service.isInitialized = true;

				help.configure(Markconf);

				activeServer = server;
				activeServer.configure(Markconf);
				activeRequestHandler = requests(Markconf, plugins);

				// Plugin helpers are attached here
				service.help = {};

				resolve(service);
			})
			.catch(err => {
				log.error(err);
				reject(err);
			});
		})
		.catch(err => {
			log.error(err);
			reject(err);
		});
	});

	const startServer = service => new Promise((resolve, reject) => {
		log.trace('Starting Markserv...');

		activeServer.start(activeRequestHandler).then(() => {
			service.httpServer = activeServer.server.http;
			resolve(service);
		}).catch(err => {
			reject(err);
		});

		log.trace('Markserv http server started successfully.');
	});

	const kill = service => {
		if ({}.hasOwnProperty.call(service, 'httpServer')) {
			service.httpServer.kill();
			// can we kill connect app too, or is that irrelavent?
		}
		return service;
	};

	const service = {
		Markconf,
		configure,
		startServer,
		kill
	};

	service.configure(service)
	.then(startServer)
	.then(resolve)
	.catch(err => {
		log.error(err);
		// We want to pass back the service so we can test what failed
		resolve(service);
	});
});

module.exports = {
	spawnService,
	plugin
};
