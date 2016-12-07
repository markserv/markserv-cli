const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');

module.exports = config => {
	const cwd = process.cwd();

	const isMarkdownFile = file => {
		let extension;
		const fileExtension = path.extname(file);
		const markdownExtensions = config.MarkconfDefaults.fileTypes.markdown;
		for (const index in markdownExtensions) {
			if ({}.hasOwnProperty.call(markdownExtensions, index)) {
				extension = markdownExtensions[index];
				if (extension === fileExtension) {
					return true;
				}
			}
		}
	};

	const directoryExists = dir => new Promise((resolve, reject) => {
		fs.stat(dir, (err, stat) => {
			if (err) {
				return reject(err);
			}

			const isDirectory = stat.isDirectory();
			resolve(isDirectory);
		});
	});

	const fileExists = path => new Promise((resolve, reject) => {
		try {
			fs.stat(path, (error, file) => {
				if (!error && file.isFile()) {
					return resolve(true);
				}

				if (error && error.code === 'ENOENT') {
					return resolve(false);
				}
			});
		} catch (err) {
			reject(err);
		}
	});

	const fileExistsSync = path => {
		let exists;

		try {
			const stat = fs.statSync(path);
			if (stat.isFile()) {
				exists = true;
			}
		} catch (err) {
			exists = false;
		}

		return exists;
	};

	const directoryExistsSync = path => {
		let exists;

		try {
			const stat = fs.statSync(path);
			if (stat.isDirectory()) {
				exists = true;
			}
		} catch (err) {
			exists = false;
		}

		return exists;
	};

	const readfile = filepath => new Promise((resolve, reject) => {
		fs.readFile(filepath, 'utf8', (err, contents) => {
			if (err) {
				return reject(err);
			}

			resolve(contents);
		});
	});

	const readfileSync = filepath => {
		return fs.readFileSync(filepath, 'utf8');
	};

	const npmModuleExists = modname => {
		const sep = path.sep;
		const modpath = cwd + sep + 'node_modules' + sep + modname;
		return directoryExists(modpath);
	};

	return {
		isMarkdownFile,
		directoryExists,
		fileExists,
		fileExistsSync,
		directoryExistsSync,
		npmModuleExists,
		readfile,
		readfileSync
	};
};
