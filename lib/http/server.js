const http = require('http');

const connect = require('connect');
const Promise = require('bluebird');
const openporthost = require('open-port-host');
const httpShutdown = require('http-shutdown');
const requestHandler = require('app/lib/http/requests');
const connectLiveReload = require('connect-livereload');

const log = require('app/lib/core/log');

module.exports = config => {
	const server = {};

	const findOpenPort = range => new Promise((resolve, reject) => {
		const options = {
		// debug: true,
			start: parseInt(range[0], 10),
			end: parseInt(range[1], 10),
			host: config.args.address
		};

		openporthost(options).then(resolve).catch(reject);
	});

	const startConnectApp = props => {
		const connectApp = connect();

		connectApp.use('/', props.requestHandler);

		// if (Reflect.has(config, 'watch')) {
		// 	connectApp.use(connectLiveReload({
		// 		port: config.watch.liveReloadPort
		// 	}));
		// }

		return connectApp;
	};

	const startHTTPServer = connectApp => new Promise((resolve, reject) => {
		if (config.args.port.indexOf('-') > -1) {
			const minMax = config.args.port.split('-');
			const portrange = [minMax[0], minMax[1]];

			findOpenPort(portrange).then(port => {
				server.port = port;
				const httpServer = http.createServer(connectApp);
				httpServer.listen(port, config.args.address);
				const killableHttpServer = httpShutdown(httpServer);
				resolve(killableHttpServer);
			}).catch(err => {
				reject(err);
			});
		} else {
			const port = config.args.port;
			server.port = port;
			const httpServer = http.createServer(connectApp);
			httpServer.listen(port, config.args.address);
			const killableHttpServer = httpShutdown(httpServer);
			resolve(killableHttpServer);
		}
	});

	const logInitializedMarkservConfig = () => {
		log.endInitialization();
		server.url = `http://${config.args.address}:${server.port}`;
		log.info(`Serving content from: ${log.ul(config.root)}`);
		log.info(`Serving at address: ${log.ul(server.url)}`);
		log.info(`Process Id: ${config.pid}`);
		log.info(`To exit Markserv: press Ctrl + C twice.`);
		log.info(`To kill Markserv: type "[sudo] kill [-9] ${config.pid}".`);
	};

	let activeServer;

	server.shutdown = () => {
		activeServer.shutdown(() => {
			log.warn('The HTTP server was shut down.');
		});
	};

	server.start = () => new Promise((resolve, reject) => {
		const handler = requestHandler(config);
		const connectApp = startConnectApp({requestHandler: handler});

		startHTTPServer(connectApp).then(httpServer => {
			activeServer = httpServer;
			config.httpServer = server;
			logInitializedMarkservConfig();
			resolve(config);
		}).catch(err => {
			reject(err);
		});
	});

	return server;
};
