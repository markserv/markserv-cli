const path = require('path')
const fs = require('fs')
const request = require('request')

const Promise = require('bluebird')
const minimatch = require('minimatch')
const mkdirp = require('mkdirp')

const log = require('app/lib/core/log')
const relinker = require('app/lib/http/relinker')

const ignoredDirectories = [
	'./',
	'../',
	'tmp/',
	'**/.git',
	'**/node_modules'
]

const logError = err => {
	log.error('Error reading dir:')
	return err
}

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

	const exportPatterns = markservService.MarkconfJs.export

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

	const matchOpts = {
		matchBase: true,
		dot: true
	}

	const isMatchedPath = filePath =>
		Reflect.ownKeys(exportPatterns)
		.find(filePattern =>
			minimatch(filePath, filePattern, matchOpts) && exportPatterns[filePattern]
		)

	const isDirectory = stats => stats.isDirectory()

	const isDirIgnored = filePath =>
		ignoredDirectories.some(dirToIgnore => {
			return minimatch(filePath, dirToIgnore, matchOpts)
		})

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

					if (typeof match === 'string') {
						files.push({
							filePath,
							dest: exportPatterns[match]
						})
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
		// if (!fs.exists(path.dirname(outputPath))) {
		// }
		mkdirp(path.dirname(outputPath), err => {
			if (err) {
				return reject(err)
			}

			fs.writeFile(outputPath, body, err => {
				if (err) {
					return reject(err)
				}

				resolve()
				console.log(`Exported file ${outputPath}!`)
			})
		})
	})

	const root = markservService.root

	walkDir({root}).then(result => {
		console.log(result.files)
		const writePromises = []

		// result.files.forEach(file => {
		// 	const relativePath = path.relative(root, file.filePath)
		// 	const localPath = path.relative(root, path.dirname(file.filePath))
		// 	const outputPath = path.join(root, file.dest, localPath, path.parse(file.filePath).name) + '.html'
		// 	const url = markservService.httpServer.url + '/' + relativePath
		// 	// process.exit()
		// 	console.log(outputPath)

		// 	request({uri: url}, (error, response, body) => {
		// 		if (response.statusCode === 200) {
		// 			relinker(body, localPath).then(output => {
		// 				writePromises.push(writeHtmlFile(outputHtml, outputPath))
		// 			})
		// 		}
		// 	})
		// })

		return Promise.all(writePromises)
	}).catch(err => {
		console.log(err)
	})

	resolve(markservService)
})

module.exports = exporter
