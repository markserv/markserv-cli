const chokidar = require('chokidar')

const log = require('app/lib/core/log')

module.exports = config => {
	const ignore = config.MarkconfDefaults.watch.ignore
	let watcher

	return {
		create: (dirs, callback) => {
			log.info(`Watching directory(ies):`)
			log.info(dirs)

			watcher = chokidar.watch(dirs, {
				ignored: ignore,
				persistent: true,
				followSymlinks: false
			})

			watcher.on('ready', () => {
				log.trace('Watch: initial scan complete.')

				watcher.on('add', path => {
					log.trace(`Watch: add: ${log.ul(path)}`)
					callback(path, 'add')
				})

				watcher.on('change', path => {
					log.trace(`Watch: changed: ${log.ul(path)}`)
					callback(path, 'change')
				})

				watcher.on('unlink', path => {
					log.trace(`Watch: unlinked: ${log.ul(path)}`)
					callback(path, 'unlink')
				})
			})

			return watcher
		},

		add: (...files) => {
			log.trace('Watch: setup: adding files to watch list.')
			watcher.add(files)
			return watcher
		},

		close: () => {
			log.trace('Watch: close: closing watcher.')
			watcher.close()
			return watcher
		}
	}
}

