// const path = require('path');
// const fs = require('fs');

const chokidar = require('chokidar');

// const defaultIgnore = /(^|[/\\])\../;
const ignore = [
	// '**/node_modules/**/*',
	'**/.git/*',
	'**/.svn/*',
	'**/.hg/*'
];

let watcher;

module.exports = {
	create: (dirs, callback) => {
		console.log(dirs);
		watcher = chokidar.watch(dirs, {
			ignored: ignore,
			persistent: true,
			followSymlinks: false
		});

		// watcher.on('add', callback);
		watcher.on('change', callback);
		watcher.on('unlink', callback);
		return watcher;
	},

	add: (...files) => {
		// console.log(files);
		watcher.add(files);
		return watcher;
	},

	close: () => {
		watcher.close();
		return watcher;
	}
};

