const path = require('path')

const Promise = require('bluebird')
const cheerio = require('cheerio')

const log = require('app/lib/core/log')
const validate = require('app/lib/http/validate')

const init = () => {
	let config

	const setConfig = newConfig => {
		config = newConfig
	}

	let includers

	const setIncluders = includerPlugins => {
		includers = includerPlugins
	}

	const isComment = node => {
		if ({}.hasOwnProperty.call(node, 'type') === false) {
			return false
		}

		return node.type === 'comment'
	}

	const getCommentIsMarkserv = node => {
		return node.data
		.slice(0, node.data.indexOf('|'))
		.replace(/\s+/g, '')
		.toLowerCase() === 'markserv'
	}

	const availableIncluder = includerName => {
		if (!includers) {
			log.warn(`No includers, were found when looking for: ${includerName}.`)
			return false
		}

		const plugin = includers[includerName]

		if (typeof plugin === 'object' &&
			typeof plugin.htmlCommentIncluder === 'function') {
			return plugin
		}

		return false
	}

	const isUrl = dirname => {
		const patterns = [
			'//',
			'http://',
			'https://'
		]

		return patterns.some(pattern => dirname.indexOf(pattern) === 0)
	}

	const unpackCommentData = node => {
		const parts = node.data.split('|')

		const data = {}

		if ({}.hasOwnProperty.call(parts, 1)) {
			data.includer = parts[1]
		}

		if ({}.hasOwnProperty.call(data, 'includer')) {
			data.plugin = availableIncluder(data.includer)
		}

		if ({}.hasOwnProperty.call(parts, 2)) {
			if (isUrl(parts[2])) {
				data.url = parts[2]
			} else {
				data.filename = path.basename(parts[2])
				data.dirname = path.dirname(parts[2])
			}
		}

		if ({}.hasOwnProperty.call(parts, 3)) {
			data.params = parts[3]
		}

		return data
	}

	const compileTemplate = (templateFilepath, modifier, include, node) => {
		let $DOM

		const processNode = (node, include, dir) => new Promise((resolve, reject) => {
			let requestPath

			if (Reflect.has(include, 'dirname') && Reflect.has(include, 'filename')) {
				requestPath = path.join(dir, include.dirname, include.filename)
			} else if (Reflect.has(include, 'url')) {
				requestPath = path.relative(config.root, dir) + '/' + include.url
				if (requestPath[0] === '/') {
					requestPath = requestPath.substr(1)
				}
			}

			if (typeof requestPath === 'string') {
				compileTemplate(requestPath, modifier, include)
				.then(content => {
					const $content = cheerio.load(content)._root
					$DOM(node).replaceWith($content)
					resolve(node)
				}).catch(err => {
					reject(err)
				})
			} else if (include.includer === '{plugin-template}') {
				const $content = cheerio.load(modifier.pluginTemplate)._root
				$DOM(node).replaceWith($content)
				resolve(node)
			} else if (include.includer === '{import-template}') {
				const $content = cheerio.load(modifier.subPlugin.template)._root
				$DOM(node).replaceWith($content)
				resolve(node)
			}
		})

		const filter = (node, dir, file) => {
			return new Promise((resolve, reject) => {
				if (typeof node !== 'object' ||
					{}.hasOwnProperty.call(node, 'children') === false) {
					return resolve(node)
				}

				const promiseStack = []

				node.childNodes.forEach(childNode => {
					const include = isComment(childNode) &&
					getCommentIsMarkserv(childNode) &&
					unpackCommentData(childNode, dir)

					if (include) {
						log.trace(`Markserv includer found in ${log.ul(file)} ...`)
						log.trace(log.hl(`<-- ${childNode.data} -->`))
						promiseStack.push(processNode(childNode, include, dir))
					} else {
						promiseStack.push(filter(childNode, dir, file))
					}
				})

				if (promiseStack.length === 0) {
					return resolve(node)
				}

				Promise.all(promiseStack).then(() => {
					resolve()
				}).catch(err => {
					reject(err)
				})
			})
		}

		return new Promise((resolve, reject) => {
			log.trace(`Compiling template from HTML file: ${log.ul(templateFilepath)}`)

			if (typeof include === 'undefined') {
				config.helpers.fs.readfile(templateFilepath)
				.then(html => {
					validate(html, templateFilepath)
					.then(() => {
						$DOM = cheerio.load(html)

						const $rootElem = $DOM._root
						const templateRoot = path.dirname(templateFilepath)

						filter($rootElem, templateRoot, templateFilepath).then(() => {
							const htmlOutput = $DOM.html()
							resolve(htmlOutput)
						}).catch(err => {
							log.console(err)
							log.error(err)
							reject(err)
						})
					}).catch(reject)
				})
				.catch(err => {
					reject(err)
				})
			}

			if (typeof include === 'object') {
				if (!include.plugin) {
					resolve('')
				}

				return include.plugin.htmlCommentIncluder(templateFilepath, include, node)
				.then(html => {
					validate(html, templateFilepath)
					.then(() => {
						$DOM = cheerio.load(html)

						const $rootElem = $DOM._root
						const templateRoot = path.dirname(templateFilepath)

						filter($rootElem, templateRoot, templateFilepath).then(() => {
							const htmlOutput = $DOM.html()
							resolve(htmlOutput)
						}).catch(err => {
							log.error(err)
							reject(err)
						})
					}).catch()
				})
				.catch(err => {
					reject(err)
				})
			}

			if (typeof include === 'string') {
				$DOM = cheerio.load(include)

				const $rootElem = $DOM._root
				const templateRoot = path.dirname(templateFilepath)

				return filter($rootElem, templateRoot, templateFilepath).then(() => {
					const htmlOutput = $DOM.html()
					resolve(htmlOutput)
				}).catch(err => {
					log.error(err)
					reject(err)
				})
			}
		})
	}

	const compiler = {
		setConfig,
		setIncluders,
		compileTemplate
	}

	return compiler
}

module.exports = {init}
