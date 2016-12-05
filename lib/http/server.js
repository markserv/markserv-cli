const http = require('http');
const connect = require('connect');
const Promise = require('bluebird');
const openporthost = require('open-port-host');
const httpShutdown = require('http-shutdown');

// const liveReload = require('livereload');
// const connectLiveReload = require('connect-livereload');

const log = require('app/lib/core/log');

let Markconf;
let httpServer;

const configure = conf => {
	Markconf = conf;
	return Markconf;
};

const findOpenPort = range => new Promise((resolve, reject) => {
	const options = {
	// debug: true,
		start: parseInt(range[0], 10),
		end: parseInt(range[1], 10),
		host: Markconf.args.address
	};

	openporthost(options).then(resolve).catch(reject);
});

const startConnectApp = props => {
	const connectApp = connect()
		.use('/', props.requestHandler);
	return connectApp;
};

const startHTTPServer = connectApp => new Promise((resolve, reject) => {
	if (Markconf.args.port.indexOf('-') > -1) {
		const minMax = Markconf.args.port.split('-');
		const portrange = [minMax[0], minMax[1]];

		findOpenPort(portrange).then(port => {
			Markconf.port = port;
			const httpServer = http.createServer(connectApp);
			httpServer.listen(port, Markconf.args.address);
			const killableHttpServer = httpShutdown(httpServer);
			resolve(killableHttpServer);
		}).catch(err => {
			reject(err);
		});
	} else {
		const port = Markconf.args.port;
		Markconf.port = port;
		const httpServer = http.createServer(connectApp);
		httpServer.listen(port, Markconf.args.address);
		const killableHttpServer = httpShutdown(httpServer);
		resolve(killableHttpServer);
	}
});

const kill = () => {
	module.exports.server.http.shutdown(() => {
		log.warn('The HTTP server was shut down.');
	});
};

const logConfig = () => {
	log.endInitialization();
	Markconf.url = `http://${Markconf.args.address}:${Markconf.port}`;
	log.info(`Serving content from: ${log.ul(Markconf.root)}`);
	log.info(`Serving at address: ${log.ul(Markconf.url)}`);
	log.info(`Process Id: ${Markconf.pid}`);
	log.info(`To exit Markserv: press Ctrl + C twice.`);
	log.info(`To kill Markserv: type "[sudo] kill [-9] ${Markconf.pid}".`);
};

const start = httpRequestHandler => new Promise((resolve, reject) => {
	const connectApp = startConnectApp({
		requestHandler: httpRequestHandler
	});

	startHTTPServer(connectApp).then(httpServer => {
		module.exports.server = {
			kill,
			connect: connectApp,
			http: httpServer
		};

		logConfig();

		resolve(module.exports.server);
	}).catch(err => {
		reject(err);
	});
});

module.exports = {
	httpServer,
	configure,
	start,
	kill
};
