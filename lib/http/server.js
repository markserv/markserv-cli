const http = require('http');

const connect = require('connect');
const Promise = require('bluebird');
const httpShutdown = require('http-shutdown');
const requestHandler = require('app/lib/http/requests');

const log = require('app/lib/core/log');

module.exports = config => {
	const server = {};
	let activeServer;

	const startConnectApp = props => {
		const connectApp = connect();
		connectApp.use('/', props.requestHandler);
		return connectApp;
	};

	const startHTTPServer = (connectApp, reservedAddress) => new Promise(resolve => {
		reservedAddress.server.once('close', () => {
			server.port = reservedAddress.port;
			const httpServer = http.createServer(connectApp);

			httpServer.listen(server.port, config.args.address);
			const killableHttpServer = httpShutdown(httpServer);
			resolve(killableHttpServer);
		});

		reservedAddress.server.close();
	});

	server.shutdown = () => {
		if (!activeServer) {
			log.warn('There was no active server to shut down.');
			return;
		}

		activeServer.shutdown(() => {
			log.warn('The HTTP server was shut down.');
			activeServer = undefined;
		});
	};

	server.start = reservedAddress => new Promise((resolve, reject) => {
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
