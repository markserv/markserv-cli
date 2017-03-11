const unclosedMarkup = require('unclosed-markup')

const log = require('app/lib/core/log')

module.exports = (html, src) => new Promise((resolve, reject) => {
	log.trace(`Checking HTML ${log.hl(src)}`)

	unclosedMarkup(html)
	.then(data => {
		log.trace(`HTML Ok ${log.hl(src)}`)
		resolve(data)
	})
	.catch(err => {
		const detail = err[0]
		log.warn(`${log.hl(detail.code)} ${detail.message} in ${log.ul(src + ':' + detail.line.line)}`)
		log.warn(`${log.hl(detail.line.code.current)}`)
		log.trace(detail)
		reject(err)
	})
})
