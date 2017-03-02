const browserSync = require('browser-sync');

const log = require('app/lib/core/log');

let serverInstance = false;

const start = syncConfig => {
	log.trace('Initiating browserSync');
	log.trace(syncConfig);
	browserSync.init(syncConfig);
	serverInstance = browserSync.create();
	// serverInstance = browserSync.create('Server1');
	return serverInstance;
};

const isActive = () => {
	return serverInstance !== false;
};

const stop = () => {
	log.trace('Stopping BrowserSync');
	browserSync.exit();
	serverInstance = false;
	return serverInstance;
};

const reload = () => {
	log.trace('Reloading BrowserSync');
	browserSync.reload();
};

module.exports = {
	start,
	isActive,
	stop,
	reload
};
