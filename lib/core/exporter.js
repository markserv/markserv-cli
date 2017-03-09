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
		const {dir, nest} = props

		let branch = props.branch

		if (!branch) {
			if (nest) {
				branch = {}
			} else {
				branch = []
			}
		}

		const statsPromises = []
		const walkPromises = []

		return readDir(dir).then(dirContents => {
			dirContents.forEach(file => {
				const filePath = path.join(dir, file)
				statsPromises.push(lstat(filePath))
			})

			Promise.all(statsPromises).then(results => {
				results.forEach(result => {
					const {filePath, stats} = result

					if (isMatchedPath(filePath)) {
						if (nest) {
							const relativeDir = path.relative(dir, filePath)
							branch[relativeDir] = stats.size
						} else {
							// branch.push(filePath)
						}
						// branch[filePath] = true
						// branch.push(relativeDir)
					}

					if (isDirectory(stats)) {
						const ignored = isDirIgnored(filePath)
						console.log(ignored ? ' ' : '>', filePath)

						if (ignored) {
							return
						}

						if (nest) {
							walkPromises.push(walkDir({dir: filePath, branch: {}, nest}))
						} else {
							walkPromises.push(walkDir({dir: filePath, branch, nest}))
						}
					}
				})

				Promise.all(walkPromises).then(walks => {
					if (nest) {
						walks.forEach(walk => {
								const relativeDir = path.relative(dir, walk.dir)
								if (Reflect.ownKeys(walk.branch).length > 0) {
									branch[relativeDir] = walk.branch
								}
						})
					}

					resolve({dir, branch, nest})
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

	const nest = false
	const dir = markservService.root

	walkDir({dir, nest}).then(tree => {
		console.log()
		console.log(JSON.stringify(tree, null, 2))
		process.exit(0)
	}).catch(err => {
		console.log(err)
	})

	resolve(markservService)
})

module.exports = exporter
