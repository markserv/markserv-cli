const path = require('path')
const fs = require('fs')

const Promise = require('bluebird')
const minimatch = require('minimatch')

const log = require('app/lib/core/log')

const ignoredDirectories = [
	'./',
	'../',
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

	const tree = {}

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
			.some(filePattern =>
				minimatch(filePath, filePattern, matchOpts)
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

					if (isMatchedPath(filePath)) {
						files.push(filePath)
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

	console.log(markservService.root)

	const root = markservService.root

	walkDir({root}).then(tree => {
		console.log()
		console.log(JSON.stringify(tree, null, 2))
		process.exit(0)
	}).catch(err => {
		console.log(err)
	})

	resolve(markservService)
})

module.exports = exporter
