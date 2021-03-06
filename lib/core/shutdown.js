const Sigint = require('sigint')

const log = require('app/lib/core/log')

const sigint = Sigint.create()

const sigintDelay = 2000
let lastSigintTime = null
let sigintCount = 0

module.exports = _process => {
	sigint.on('signal', source => {
		const now = Number(new Date())

		if (source === 'keyboard' && sigintCount === 0) {
			sigintCount = 1
			log.info('Press Ctrl + C again to exit Markserv.')
			lastSigintTime = now
		} else if (source === 'keyboard' && sigintCount === 1) {
			sigintCount = 0

			if (now - lastSigintTime < sigintDelay) {
				log.info('Exiting Markserv...')
				_process.exit()
			} else {
				log.info('Press Ctrl + C faster to exit Markserv :)')
				lastSigintTime = now
				sigintCount = 0
			}
		}
	})
}
