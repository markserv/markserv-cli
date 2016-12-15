const path = require('path');

const minimatch = require('minimatch');

const log = require('app/lib/core/log');
const helpFs = require('app/lib/help/fs')();

// The reponse that gets written back to the browser
const httpRespond = (payload, res) => {
	// payload = {statusCode, contentType, data}

	// Sometimes plugin handles write to browser, if so, `payload` is null
	if (payload) {
		res.writeHead(payload.statusCode, {
			'Content-Type': payload.contentType
		});
		res.write(payload.data);
		res.end();
	}
};

const handlerChainedModifiers = (modifierStack, requestPath, res, req) => new Promise((resolve, reject) => {
	const modifierQueue = [];

	for (const modifier of modifierStack) {
		modifierQueue.push(modifier);
	}

	const newPromise = (modifier, lastPayload) => new Promise((resolve, reject) => {
		modifier.handle(requestPath, res, req, lastPayload)
		.then(nextPayload => {
			const nextModifier = modifierQueue.shift();

			if (nextModifier) {
				const nextPromise = newPromise(nextModifier, nextPayload);
				return resolve(nextPromise);
			}

			return resolve(nextPayload);
		})
		.catch(err => {
			reject(err);
		});
	});

	const nextModifier = modifierQueue.shift();
	const nextPromise = newPromise(nextModifier);

	return resolve(nextPromise)
	.catch(err => {
		reject(err);
	});
});

const isLastCharInStr = (str, char) => {
	const isLastChar = str[str.length - 1] === char;
	return isLastChar;
};

const init = config => {
	const logHttpResponse = (payload, req, type) => {
		let responseLog;

		const responseUrl = config.httpServer.url + req.originalUrl;
		responseLog = log.ok('Response: ') + log.hl(type + ': ') + log.ul(responseUrl);

		if (payload) {
			responseLog += ' ' + log.hl(payload.statusCode);
		}

		if (payload && payload.statusCode > 399) {
			responseLog = log.info(log.red('Response: ') + log.hl(type + ': ') + log.ul(log.red(responseUrl)) + ' (' + log.red(payload.statusCode) + ').');
		}

		log.trace(responseLog);
	};

	const checkIncludes = (payload, props) => new Promise((resolve, reject) => {
		// Do not process includes in HTTTP Reqeussts if the setting:
		// `Markconf.Defaults.processIncludesInHttpRequests`, is not true
		if ({}.hasOwnProperty.call(config.MarkconfDefaults, 'processIncludesInHttpRequests') === false ||
			config.MarkconfDefaults.processIncludesInHttpRequests === false) {
			resolve(payload);
		}

		const [requestPath, modifier] = props;

		if (payload === null || !Reflect.has(payload, 'data')) {
			log.warn(`The modifier ${log.ul(modifier.name)} does not allow for include compilation.`);
			resolve();
		}

		config.compiler.compileTemplate(requestPath, modifier, payload.data)
		.then(modifiedHtml => {
			payload.data = modifiedHtml;
			resolve(payload);
		}).catch(err => {
			reject(err);
		});
	});

	const handle = (kind, requestPath, res, req) => {
		const modifier = kind.module;
		const pattern = kind.pattern;
		const definitionType = Array.isArray(modifier) ? 'array' : 'object';

		const props = [requestPath, modifier];

		if (definitionType === 'object') {
			modifier.handle(requestPath, res, req)
			.then(payload => {
				checkIncludes(payload, props)
				.then(payload => {
					httpRespond(payload, res, req);
					logHttpResponse(payload, req, pattern);
				})
				.catch(err => {
					log.error(err);
				});
			}).catch(err => {
				log.error(err);
				log.console(err.stack);
			});
		} else if (definitionType === 'array') {
			handlerChainedModifiers(modifier, requestPath, res, req)
			.then(payload => {
				checkIncludes(payload, props)
				.then(payload => {
					httpRespond(payload, res, req);
					logHttpResponse(payload, req, pattern);
				})
				.catch(err => {
					log.error(err);
				});
			}).catch(err => {
				log.error(err);
			});
		}
	};

	const matchPath = (url, config) => {
		const patterns = config.plugins.modifiers;

		for (const pattern in patterns) {
			if ({}.hasOwnProperty.call(patterns, pattern)) {
				const match = minimatch(url, pattern, {
					matchBase: true,
					dot: true
				});

				if (match) {
					const module = patterns[pattern];

					return {
						pattern,
						module
					};
				}
			}
		}

		if (Reflect.has(config, 'subconf')) {
			const subMatch = matchPath(url, config.subconf);
			if (typeof subMatch === 'object' && typeof subMatch.module === 'object') {
				return subMatch;
			}
		}

		return false;
	};

	const matchRes = (pattern, config) => {
		if (Reflect.has(config.plugins.modifiers, pattern)) {
			const module = config.plugins.modifiers[pattern];
			if (module) {
				return {
					pattern,
					module
				};
			}
		}

		if (Reflect.has(config, 'subconf')) {
			const subMatch = matchRes(pattern, config.subconf);
			if (typeof subMatch === 'object' && typeof subMatch.module === 'object') {
				return subMatch;
			}
		}

		return false;
	};

	// The incomming request from the browser (req, res)
	const handleRequest = (req, res) => {
		const url = req.url;

		let requestPath = path.join(config.root, url);

		const isDir = helpFs.directoryExistsSync(requestPath);
		const isFile = helpFs.fileExistsSync(requestPath);

		// make sure slash is on the end of a dir path for minimatch
		if (isDir && isLastCharInStr(requestPath, '/') === false) {
			requestPath += '/';
		}

		log.info('Request: ' + log.ul(requestPath));

		const exists = isFile || isDir;

		if (!exists) {
			const matchingModule = matchRes('404', config);

			if (matchingModule.module) {
				handle(matchingModule, requestPath, res, req);
				return;
			}

			log.warn(`No modifier found in Markconf to handle request: ${log.hl(requestPath)}`);
			return;
		}

		const matchingModule = matchPath(requestPath, config);

		if (isDir && matchingModule.module) {
			handle(matchingModule, requestPath, res, req);
			return;
		}

		if (isFile && matchingModule.module) {
			handle(matchingModule, requestPath, res, req);
			return;
		}

		// log.warn(`No modifier found in Markconf to handle request: ${log.hl(requestPath)}`);
	};

	return handleRequest;
};

module.exports = init;
