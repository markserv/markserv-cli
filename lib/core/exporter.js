const path = require('path');
const fs = require('fs');

const log = require('app/lib/core/log');

const readDir = path => {
	try {
		fs.readdir(path, 'utf8', (err, dir) => {
			if (err) {
				throw err;
			}

			console.log(dir);
		});
	} catch (err) {
		console.error(err);
	}
};

const exporter = service => new Promise((resolve, reject) => {
	log.trace('Starting The Exporter.');

	console.log(service.root);

	const ignoreDirs = [
		'.git',
		'node_modules'
	];

	// const ignore = (file, stats) => {
	// 	// console.log(file);
	// 	// console.log(ignoreDirs.indexOf(path.basename(file)) > -1);
	// 	if (stats.isDirectory() && ignoreDirs.indexOf(path.basename(file)) > -1) {
	// 		return true;
	// 	}

	// 	return false;
	// };

	const files = readDir(service.root);
	console.log(files);

	// 	if (err) {
	// 		log.error('Could not get directory list for exporter.');
	// 		return reject(err);
	// 	}

	// 	// console.log(files);

	resolve(service);
	// });

});

module.exports = exporter;
