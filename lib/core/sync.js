const browserSync = require('browser-sync');

let serverInstance = false;

const start = syncConfig => {
	console.log('SYNC START!');
	browserSync.init(syncConfig);
	serverInstance = browserSync.create('Server1');
	return serverInstance;
};

const isActive = () => {
	return serverInstance !== false;
};

const stop = () => {
	console.log('sync: stop bs')
	browserSync.exit();
	serverInstance = false;
	return serverInstance;
};

const reload = () => {
	browserSync.reload();
};

module.exports = {
	start,
	isActive,
	stop,
	reload
};
