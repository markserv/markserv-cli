const http = require('http');

const connect = require('connect');
const Promise = require('bluebird');
const httpShutdown = require('http-shutdown');
const requestHandler = require('app/lib/http/requests');

const log = require('app/lib/core/log');

module.exports = config => {
	const server = {};

	const startConnectApp = props => {
		const connectApp = connect();
		connectApp.use('/', props.requestHandler);
		return connectApp;
	};

	const startHTTPServer = (connectApp, reservedAddress) => new Promise((resolve, reject) => {
		reservedAddress.server.once('close', () => {
			server.port = reservedAddress.port;
			const httpServer = http.createServer(connectApp);

			httpServer.listen(server.port, config.args.address);
			const killableHttpServer = httpShutdown(httpServer);
			resolve(killableHttpServer);
		});

		reservedAddress.server.close();
	});

	let activeServer;

	server.shutdown = () => {
		activeServer.shutdown(() => {
			log.warn('The HTTP server was shut down.');
			activeServer = undefined;
		});
	};

	server.start = reservedAddress => new Promise((resolve, reject) => {
		if (activeServer) {
			config.httpServer = server;
			activeServer = config.httpServer;
			config.httpServer = server;
			return resolve(config);
		}
		const handler = requestHandler(config);
		const connectApp = startConnectApp({requestHandler: handler});

		startHTTPServer(connectApp, reservedAddress).then(httpServer => {
			activeServer = httpServer;
			config.httpServer = server;
			resolve(config);
		}).catch(err => {
			reject(err);
		});
	});

	return server;
};
