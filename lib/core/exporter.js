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

	const isMatchedPath = filePath =>
		Reflect
		.ownKeys(exportPatterns)
		.some(filePattern =>
			minimatch(filePath, filePattern, {
				matchBase: true,
				dot: true
			})
		)

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
					// console.log(result)
					// if (result.stat.isDir()) {
					// 	console.log('DIR')
					// }

					console.log(result.filePath)
					if (isMatchedPath(result.filePath)) {
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
		process.exit()
	}).catch(err => {
		console.log(err)
	})

	resolve(markservService)
})

module.exports = exporter
