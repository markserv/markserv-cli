const path = require('path')
const fs = require('fs')

const Promise = require('bluebird')
const minimatch = require('minimatch')

const log = require('app/lib/core/log')

const defaultIgnore = [
	'./',
	'../',
	'.git/',
	'node_modules/'
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
			fs.stat(filePath, (err, stat) => {
				if (err) {
					return reject(err)
				}
				resolve({filePath, stat})
			})
		} catch (err) {
			reject(err)
		}
	})

	const isMatchedPath = result => {
		const {filePath} = result

		let isMatch = false

		Reflect.ownKeys(exportPatterns).some(filePattern => {
			const match = minimatch(filePath, filePattern, {
				matchBase: true,
				dot: true
			})

			if (match) {
				return true
			}

			return false
		})

		return isMatch
	}

	const walkDir = nextDir => new Promise((resolve, reject) => {
		readDir(nextDir).then(dir => {
			const promises = []

			dir.forEach(file => {
				const filePath = path.join(nextDir, file)
				promises.push(lstat(filePath))
			})

			Promise.all(promises).then(results => {
				const branch = {}

				results.forEach(result => {
					if (isMatchedPath(result)) {
						branch[result.filePath] = true
					}
				})

				resolve(branch)
			}).catch(err => {
				console.log(err)
			})
		}).catch(err => {
			log.error(`Error walking dir ${log.ul(path)}`)
			reject(err)
		})
	})

	walkDir(markservService.root).then(tree => {
		console.log(tree)
	}).catch(err => {
		console.log(err)
	})

	resolve(markservService)
})

module.exports = exporter
