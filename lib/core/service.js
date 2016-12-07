const Promise = require('bluebird');

const log = require('app/lib/core/log');
const requests = require('app/lib/http/requests');
const server = require('app/lib/http/server');

const service = config => new Promise((resolve, reject) => {
	log.trace('Starting The Markserv Service.');

	const startServer = service => new Promise((resolve, reject) => {
		log.trace('Starting HTTP Server.');

		const requestHandler = requests(config);

		server(config)
		.start(requestHandler)
		.then(activeServer => {
			log.trace('Markserv HTTP Server started successfully.');
			// service.httpServer = activeServer;
			require('app/lib/core/shutdown')(process);
			service.initialized = true;
			resolve(service);
		}).catch(err => {
			log.error('Failed to start Markserv HTTP Server!');
			reject(err);
		});
	});

	const shutdown = service => {
		if ({}.hasOwnProperty.call(service, 'httpServer')) {
			service.httpServer.shutdown();
		}
		return service;
	};

	const initialized = false;

	const service = Object.assign({},
		config,
		initialized,
		shutdown,
		{helpers: require('app/lib/help/plugins')(config)}
	);

	startServer(service)
	.then(resolve)
	.catch(err => {
		log.error('Could not start Markserv service!');
		log.error(err);
		reject(err);
	});
});

module.exports = service;
