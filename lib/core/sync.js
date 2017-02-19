const browserSync = require('browser-sync');

let serverInstance = false;

const start = config => {
	console.log(config);

	browserSync.init({
		// server: './',
		proxy: 'localhost:8000',
		notify: false
	});

	serverInstance = browserSync.create('Server1');

	return serverInstance;
};

const isActive = () => {
	return serverInstance !== false;
};

const stop = () => {
	browserSync.exit();
	serverInstance = false;
	return serverInstance;
};

module.exports = {
	start,
	isActive,
	stop
};
