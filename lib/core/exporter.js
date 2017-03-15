const path = require('path')
const fs = require('fs')
const request = require('request')

const Promise = require('bluebird')
const mkdirp = require('mkdirp')
const micromatch = require('micromatch')

const log = require('app/lib/core/log')
const relinker = require('app/lib/http/relinker')

const ignoredDirectories = [
	'.git/',
	'node_modules/',
	'tmp/'
]

const readDir = path => new Promise((resolve, reject) => {
	try {
		fs.readdir(path, 'utf8', (err, dir) => {
			if (err) {
				return reject(log.error(err))
			}

			resolve(dir)
		})
	} catch (err) {
		reject(log.error(err))
		log.error(err)
		reject(err)
	}
})

const exporter = markservService => new Promise((resolve, reject) => {
	log.trace('Starting The Exporter.')

	const hasExport = Reflect.has(markservService.MarkconfJs, 'export')

	if (!hasExport) {
		return resolve(markservService)
	}

	const exportDef = markservService.MarkconfJs.export
	const ignoredDirectories = exportDef.ignore || markservService.defaults.export.ignore

	const lstat = filePath => new Promise((resolve, reject) => {
		try {
			fs.stat(filePath, (err, stats) => {
				if (err) {
					return reject(err)
				}

				resolve({filePath, stats})
			})
		} catch (err) {
			reject(err)
		}
	})

	const isMatchedPath = filePath => {
		let haveMatch = false

		Reflect.ownKeys(exportDef.serve).forEach(dest => {
			const localPath = path.relative(markservService.root, filePath)
			const filePatterns = exportDef.serve[dest]
			const match = micromatch(localPath, filePatterns)
			// console.log(filePath, filePatterns, match)
			if (match.length > 0) {
				haveMatch = true
			}
		})

		return haveMatch
	}

	const getDests = filePath => {
		const dests = []

		Reflect.ownKeys(exportDef.serve).forEach(dest => {
			const localPath = path.relative(markservService.root, filePath)
			const filePatterns = exportDef.serve[dest]
			const match = micromatch(localPath, filePatterns)
			// console.log(filePath, filePatterns, match)
			if (match.length > 0) {
				dests.push(dest)
			}
		})

		return dests
	}

	const isDirectory = stats => stats.isDirectory()

	const isDirIgnored = filePath => {
		const localPath = path.relative(markservService.root, filePath)
		const matchResult = micromatch(localPath, ignoredDirectories)

		if (matchResult.length > 0) {
			return true
		}

		return false
	}

	const walkDir = props => new Promise((resolve, reject) => {
		let {root, files} = props

		if (!files) {
			files = []
		}

		const statsPromises = []
		const walkPromises = []

		return readDir(root).then(dirContents => {
			dirContents.forEach(file => {
				const filePath = path.join(root, file)
				statsPromises.push(lstat(filePath))
			})

			Promise.all(statsPromises).then(results => {
				results.forEach(result => {
					const {filePath, stats} = result

					const match = isMatchedPath(filePath)
					if (match) {
						const dests = getDests(filePath)

						if (Array.isArray(dests)) {
							files.push({
								filePath,
								dest: dests
							})
						}
					}

					if (isDirectory(stats)) {
						const ignored = isDirIgnored(filePath)

						if (ignored) {
							return
						}

						walkPromises.push(walkDir({root: filePath, files}))
					}
				})

				Promise.all(walkPromises).then(() => {
					resolve({root, files})
				}).catch(reject)
			}).catch(err => {
				console.log(err)
			})
		}).catch(err => {
			log.error(`Error walking dir ${log.ul(path)}`)
			reject(err)
		})
	})

	const writeHtmlFile = (html, outputPath) => new Promise((resolve, reject) => {
		mkdirp(path.dirname(outputPath), err => {
			if (err) {
				return reject(err)
			}

			fs.writeFile(outputPath, html, err => {
				if (err) {
					return reject(err)
				}

				resolve()
				log.info(`Exported file: ${log.ul(outputPath)}`)
			})
		})
	})

	const root = markservService.root

	walkDir({root}).then(result => {
		console.log(result.files)
		const writePromises = []

		result.files.forEach(file => {
			const relativePath = path.relative(root, file.filePath)
			const localPath = path.relative(root, path.dirname(file.filePath))

			const outputPaths = []
			file.dest.forEach(dest => {
				const outputPath = path.join(root, dest, localPath, path.parse(file.filePath).name) + '.html'
				outputPaths.push(outputPath)
			})

			const url = markservService.httpServer.url + '/' + relativePath
			console.log(url)

			request({uri: url}, (error, response, body) => {
				if (!body) {
					return false
				}

				if (response.statusCode === 200) {
					relinker(body, localPath).then(htmlOutput => {
						outputPaths.forEach(outputPath => {
							writePromises.push(writeHtmlFile(htmlOutput, outputPath))
						})
					})
				}
			})
		})

		return Promise.all(writePromises)
	}).catch(err => {
		console.log(err)
	})

	resolve(markservService)
})

module.exports = exporter
