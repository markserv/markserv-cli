const fs = require('fs')
const path = require('path')

const Horseman = require('node-horseman')
const chai = require('chai')

const expect = chai.expect

const argv = [null, null,
	// Use the Markconf file from this spec directory
	'-c', __dirname,
	'-r', __dirname,
	'-o', false,
	'-b', false,
	'-n', false,
	'-l', 'OFF'
]

const MarkconfFilePath = path.join(__dirname, 'Markconf.js')

const writeState = index => {
	const MarkconfText = fs.readFileSync(path.join(__dirname, `Markconf.${index}.js`)).toString()
	fs.writeFileSync(MarkconfFilePath, MarkconfText, 'utf8')
}

const expectedHtml1 = fs.readFileSync(path.join(__dirname, 'expected1.html'), 'utf8')
const expectedHtml2 = fs.readFileSync(path.join(__dirname, 'expected2.html'), 'utf8')

describe('watch Markconf.js', () => {
	it('should reload page when Markconf.js changes', function (done) {
		const timeout = 10 * 1000
		this.timeout(timeout)

		require('app/markserv')(argv).then(markserv => {
			// console.log(markserv)

			expect(markserv.initialized).to.be.a('boolean')
			expect(markserv.initialized).to.equal(true)
			expect(markserv.MarkconfJs).to.be.an('object')

			// console.log(markserv)

			const address = markserv.args.address
			const port = markserv.browserSync.port
			const url = `http://${address}:${port}/test.html`

			// console.log(url)
			writeState(1)

			setTimeout(() => {
				const horseman = new Horseman({
					timeout: timeout
				})
				.userAgent('Mozilla/5.0 (Windows NT 6.1 WOW64 rv:27.0) Gecko/20100101 Firefox/27.0')
				.wait(100)
				.open(url)
				.evaluate(function () {
					return document.getElementsByTagName('body')[0].innerHTML
				})
				.then(function (actualHtml1) {
					// get rid of browsersync js that <script> with paths
					// that differ between OSX/Linux/win
					actualHtml1 = actualHtml1.split('\n')[3]
					expect(expectedHtml1).to.equal(actualHtml1)
					// console.log(expectedHtml1)
					// console.log(actualHtml1)
					writeState(2)
				})
				.wait(2000)
				.evaluate(function () {
					return document.getElementsByTagName('body')[0].innerHTML
				})
				.then(function (actualHtml2) {
					// get rid of browsersync js that <script> with paths
					// that differ between OSX/Linux/win
					actualHtml2 = actualHtml2.split('\n')[3]
					expect(expectedHtml2).to.equal(actualHtml2)
					// console.log(expectedHtml2)
					// console.log(actualHtml2)
					done()
				})
				.close()
			}, 1000)
		})
	})
})
