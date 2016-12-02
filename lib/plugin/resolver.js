const path = require('path');

const log = require('app/lib/core/log');
const fs = require('app/lib/help/fs');
const registerPlugin = require('app/lib/plugin/register');

// const findPackageJson = dirname => {
// 	const packageFile = path.join(dirname, 'package.json');
// 	const packageExists = fs.fileExistsSync(packageFile);

// 	if (packageExists) {
// 		return require(packageFile);
// 	}

// 	const nextDir = path.dirname(dirname, '../');

// 	// replace process.cwd() with dir that is specifed in conf
// 	if (nextDir === process.cwd()) {
// 		return false;
// 	}

// 	return findPackageJson(nextDir);
// };

const keyType = ref => {
	return Array.isArray(ref) ? '_array' : `_${typeof ref}`;
};

const resolver = {
	_function: elem => new Promise(resolve => {
		resolve(elem);
	}),

	_string: (name, type, key, def) => new Promise((resolve, reject) => {
		const pluginCb = require(name);

		if (typeof pluginCb !== 'function') {
			return reject(false);
		}

		const plugin = registerPlugin(name, key, type);
		// console.log(plugin);

		// const pluginMod = registerPlugin(name, key, type);

		if (!def) {
			return resolve(plugin);
		}

		if (type === 'modifier') {
			console.log(def);
			return resolve(plugin);
		}
	}),

	_object: (item, type, key) => new Promise((resolve, reject) => {
		if ({}.hasOwnProperty.call(item, 'module') === false) {
			log.error(`Plugin object for ${log.hl(item)} should have a module property.`);
			return reject(false);
		}

		resolver._string(item.module, type, key, item).then(resolve).catch(reject);
	}),

	_array: (elem, type, key) => new Promise((resolve, reject) => {
		elem.map(item => {
			return resolver[type(item)](item, type, key);
		});

		Promise.all(elem).then(results => {
			resolve(results);
		}).catch(err => {
			reject(err);
		});
	})
};

const resolveConf = (conf, type) => new Promise((resolve, reject) => {
	const promises = [];

	Reflect.ownKeys(conf).forEach(key => {
		const elem = conf[key];
		promises.push(resolver[keyType(elem)](elem, type, key));
	});

	Promise.all(promises).then(results => {
		const liveConf = {};

		Reflect.ownKeys(conf).forEach((key, index) => {
			liveConf[key] = results[index];
		});

		resolve(liveConf);
	}).catch(err => {
		reject(err);
	});
});

module.exports = confPath => new Promise((resolve, reject) => {
	const providedPath = confPath.split('Markconf.js')[0];
	const confDir = path.resolve(providedPath);
	const confFile = path.resolve(path.join(confDir, 'Markconf.js'));
	log.trace('Resolving Markconf for path: ' + log.ul(confFile));

	// console.log(confPath);

	let MarkconfJs;
	let error;

	// console.log(confFile);

	try {
		MarkconfJs = require(confFile);
	} catch (err) {
		error = err;
		MarkconfJs = false;
	}

	if (MarkconfJs) {
		log.trace('Markconf ' + log.ul(confFile) + ' loaded successfully.');
		log.trace(MarkconfJs);
		// configure(MarkconfJs);

		const promises = [];

		if ({}.hasOwnProperty.call(MarkconfJs, 'modifiers')) {
			promises.push(resolveConf(MarkconfJs.modifiers, 'modifier'));
		}

		Promise.all(promises).then(plugins => {
			// console.log(plugins);
			resolve({
				modifiers: plugins[0]
			});
		}).catch(err => {
			reject(err);
		});

		// const props = [MarkconfJs, confDir];

		// buildActiveMarkconf(props).then(activeMarkconf => {
		// 	resolve(activeMarkconf);
		// }).catch(err => {
		// 	reject(err);
		// });

		return;
	}

	log.error('Markconf ' + log.ul(confFile) + ' could not be loaded!');
	return error;

	// const confFile = require(path.join(process.cwd(), 'conf.js'));
	// const app = resolveConf(confFile);
	// console.log('app:', app);
});
