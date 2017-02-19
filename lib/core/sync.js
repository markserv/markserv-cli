const browserSync = require('browser-sync');

const openporthost = require('open-port-host');

let serverInstance = false;

const start = syncConfig => {
	browserSync.init(syncConfig);
		// proxy: 'localhost:8000',
		// notify: false
	// });

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

const reload = () => {
	browserSync.reload();
};

module.exports = {
	start,
	isActive,
	stop,
	reload
};
