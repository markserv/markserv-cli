const path = require('path')
const fs = require('fs')

const micromatch = require('micromatch')

const log = require('app/lib/core/log')
const helpFs = require('app/lib/help/fs')()
const Handlebars = require('handlebars')
const chalk = require('chalk')

// The reponse that gets written back to the browser
// payload = {statusCode, contentType, data}
const httpRespond = (payload, res) => {
	// Sometimes plugin handles write to browser, if so, `payload` is null
	if (typeof payload === 'object') {
		res.writeHead(payload.statusCode, {
			'Content-Type': payload.contentType
		})
		res.write(payload.data)
		res.end()
	}
}

const handlerChainedModifiers = (modifierStack, requestPath, res, req) => new Promise((resolve, reject) => {
	const modifierQueue = []

	for (const modifier of modifierStack) {
		modifierQueue.push(modifier)
	}

	const newPromise = (modifier, lastPayload) => new Promise((resolve, reject) => {
		modifier.handle(requestPath, res, req, lastPayload)
		.then(nextPayload => {
			const nextModifier = modifierQueue.shift()

			if (nextModifier) {
				const nextPromise = newPromise(nextModifier, nextPayload)
				return resolve(nextPromise)
			}

			return resolve(nextPayload)
		})
		.catch(err => {
			reject(err)
		})
	})

	const nextModifier = modifierQueue.shift()
	const nextPromise = newPromise(nextModifier)

	return resolve(nextPromise)
	.catch(err => {
		reject(err)
	})
})

const init = config => {
	const logHttpResponse = (payload, req, type) => {
		let responseLog

		const responseUrl = config.httpServer.url + req.originalUrl

		responseLog = chalk.green('Response: ') + log.hl(type + ': ') + log.ul(responseUrl)

		if (payload) {
			responseLog += ' ' + log.hl(payload.statusCode)
		}

		if (payload && payload.statusCode > 399) {
			responseLog = log.info(log.red('Response: ') + log.hl(type + ': ') + log.ul(log.red(responseUrl)) + ' (' + log.red(payload.statusCode) + ').')
		}

		log.info(responseLog)
	}

	const checkIncludes = (payload, props) => new Promise((resolve, reject) => {
		// Do not process includes in HTTTP Reqeussts if the setting:
		// `Markconf.Defaults.processIncludesInHttpRequests`, is not true
		if ({}.hasOwnProperty.call(config.MarkconfDefaults, 'processIncludesInHttpRequests') === false ||
			config.MarkconfDefaults.processIncludesInHttpRequests === false) {
			resolve(payload)
		}

		const [requestPath, modifier] = props

		if (payload === null || !Reflect.has(payload, 'data')) {
			log.trace(`The modifier ${log.ul(modifier.name)} does not allow for include compilation.`)
			resolve()
		}

		config.compiler.compileTemplate(requestPath, modifier, payload.data)
		.then(modifiedHtml => {
			payload.data = modifiedHtml
			resolve(payload)
		}).catch(err => {
			reject(err)
		})
	})

	const filterOverrides = (data, conf) => {
		const outputData = {}

		Reflect.ownKeys(data).forEach(key => {
			if (Reflect.has(conf, 'overrides')) {
				if (Reflect.has(conf.overrides, key)) {
					outputData[key] = conf.overrides[key]
				}
			}

			if (Reflect.has(conf, 'parent')) {
				const parent = filterOverrides(data, conf.parent)
				if (Reflect.has(parent, key)) {
					outputData[key] = parent[key]
				}
			}
		})

		return outputData
	}

	const mergeOverrides = (data, conf) => {
		const overrides = filterOverrides(data, conf)
		const merged = Object.assign({}, data, overrides)
		return merged
	}

	const reverseFoldConfigTree = conf => {
		if (Reflect.has(conf, 'subconf')) {
			return Object.assign({}, conf, reverseFoldConfigTree(conf.subconf))
		}

		return conf
	}

	const handle = (kind, requestPath, res, req) => {
		const modifier = kind.module
		const pattern = kind.pattern
		const definitionType = Array.isArray(modifier) ? 'array' : 'object'

		const props = [requestPath, modifier]

		const compileTemplate = payload => {
			log.trace(payload)

			if (definitionType === 'object' && Reflect.has(modifier, 'template') && modifier.template) {
				const template = Handlebars.compile(modifier.template)
				const result = template(payload.data)
				payload.data = result
			} else 	if (definitionType === 'array' && Reflect.has(modifier[0], 'template') && modifier[0].template) {
				const template = Handlebars.compile(modifier[0].template)
				const result = template(payload.data)
				payload.data = result
			}

			return payload
		}

		if (definitionType === 'object') {
			modifier.handle(requestPath, res, req)
			.then(payload => {
				log.trace(payload)

				// Merge overrides when the exist in the Markconf
				if (payload && typeof payload.data === 'object') {
					const confData = reverseFoldConfigTree(config)
					const mergedConfPayload = Object.assign({}, payload.data, confData.overrides)
					const data = mergeOverrides(mergedConfPayload, config)
					payload.data = data
				}

				return payload
			})
			.then(compileTemplate)
			.then(payload => {
				checkIncludes(payload, props)
				.then(payload => {
					httpRespond(payload, res, req)
					logHttpResponse(payload, req, pattern)
				})
				.catch(err => {
					log.error(err)
					log.console(err.stack)
				})
			})
			.catch(err => {
				log.error(err)
				log.console(err.stack)
			})
		} else if (definitionType === 'array') {
			handlerChainedModifiers(modifier, requestPath, res, req)
			.then(payload => {
				// Merge overrides when the exist in the Markconf
				if (typeof payload.data === 'object') {
					const confData = reverseFoldConfigTree(config)
					const mergedConfPayload = Object.assign({}, payload.data, confData.overrides)
					const data = mergeOverrides(mergedConfPayload, config)
					payload.data = data
				}
				return payload
			})
			.then(compileTemplate)
			.then(payload => {
				checkIncludes(payload, props)
				.then(payload => {
					httpRespond(payload, res, req)
					logHttpResponse(payload, req, pattern)
				})
				.catch(err => {
					log.error(err)
					log.console(err.stack)
				})
			})
			.catch(err => {
				log.error(err)
				log.console(err.stack)
			})
		}
	}

	// const resolveDotDotSlashes = url => {
	// 	let realPath = ''

	// 	const parts = url.split(path.sep)
	// 	console.log(parts)

	// 	parts.forEach((part, idx) => {
	// 		if (part === '..' && idx > 0) {
	// 			delete parts[idx - 1]
	// 			delete parts[idx]
	// 		}
	// 	})

	// 	parts.forEach((part, idx) => {
	// 		if (idx < parts.length - 1) {
	// 			realPath += part + '/'
	// 		} else {
	// 			realPath += part
	// 		}
	// 	})

	// 	console.log(realPath)
	// 	return realPath
	// }

	const matchPath = (url, config) => {
		const patterns = config.plugins.modifiers
		if (url[0] === '/' && url.length > 1) {
			url = url.substr(1)
		}

		// console.log(patterns)
		for (const pattern in patterns) {
			if ({}.hasOwnProperty.call(patterns, pattern)) {
				// Exclude 404, 403, type modifiers, etc
				if (!Number.isNaN(Number(pattern))) {
					continue
				}

				const match = micromatch(url, pattern)

				console.log(chalk.bgYellow.black(
					`"${url}" "${pattern}"`,
					typeof match, match
				))
				// resolveDotDotSlashes('src/../../pwn/src/')
				console.log(fs.realpathSync(url))

				if (match.length > 0) {
					const module = patterns[pattern]

					return {
						pattern,
						module
					}
				}
			}
		}

		if (Reflect.has(config, 'subconf')) {
			const subMatch = matchPath(url, config.subconf)
			if (typeof subMatch === 'object' && typeof subMatch.module === 'object') {
				return subMatch
			}
		}

		return false
	}

	const matchRes = (pattern, config) => {
		if (Reflect.has(config.plugins.modifiers, pattern)) {
			const module = config.plugins.modifiers[pattern]
			if (module) {
				return {
					pattern,
					module
				}
			}
		}

		if (Reflect.has(config, 'subconf')) {
			const subMatch = matchRes(pattern, config.subconf)
			if (typeof subMatch === 'object' && typeof subMatch.module === 'object') {
				return subMatch
			}
		}

		return false
	}

	// The incomming request from the browser (req, res)
	const handleRequest = (req, res) => {
		// let requestUrl = req.url
		let requestUrlSoft = req.url.substr(1)
		let requestFilePath = path.resolve(config.root, requestUrlSoft)

		const isDir = helpFs.directoryExistsSync(requestFilePath)
		const isFile = helpFs.fileExistsSync(requestFilePath)

		if (isDir) {
			requestFilePath += '/'
			requestUrlSoft += '/'
			// requestUrl += '/'
		}

		requestFilePath = path.normalize(requestFilePath)
		requestUrlSoft = path.normalize(requestUrlSoft)
		// requestUrl = path.normalize(requestUrl)

		const exists = (isFile || isDir) === true
		if (!exists) {
			const matchingModule = matchRes('404', config)

			if (matchingModule.module) {
				handle(matchingModule, requestFilePath, res, req)
				return
			}

			log.warn(`No modifier found in Markconf to handle request: ${log.hl(requestFilePath)}`)
			return
		}

		const matchingModule = matchPath(requestUrlSoft, config)

		if (isDir && matchingModule.module) {
			handle(matchingModule, requestFilePath, res, req)
			return
		}

		if (isFile && matchingModule.module) {
			handle(matchingModule, requestFilePath, res, req)
			return
		}
	}

	return handleRequest
}

module.exports = init
