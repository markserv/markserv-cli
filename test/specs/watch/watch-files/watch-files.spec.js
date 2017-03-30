const fs = require('fs')
const path = require('path')

const Horseman = require('node-horseman')
const chai = require('chai')

const expect = chai.expect

const argv = [null, null,
	// Use the Markconf file from this spec directory
	'-c', __dirname,
	'-r', __dirname,
	'-l', 'OFF',
	'-o', false,
	'-b', false,
	'-n', false
	// Turn off the logger for testing
	// '-p', '8889',
	// '-l', 'TRACE'
]

const fileStates = [
	'<html><body><h1>Test 1</h1></body></html>',
	'<html><body><h2>Test 2</h2></body></html>'
]

const horseman = new Horseman()

const partialFilePath = path.join(__dirname, 'test.html')

const writeState = index => {
	const fileText = fileStates[index].toString()
	fs.writeFileSync(partialFilePath, fileText, 'utf8', err => {
		if (err) {
			return console.error(err)
		}
	})
}

const expectedHtml1 = fs.readFileSync(path.join(__dirname, 'expected1.html'), 'utf8')
const expectedHtml2 = fs.readFileSync(path.join(__dirname, 'expected2.html'), 'utf8')


describe('watch html file (browserSync/cokidar)', () => {
	it('should reload page when file changes', function (done) {
		this.timeout(20000)

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
			writeState(0)

			setTimeout(() => {
				horseman
				.userAgent('Mozilla/5.0 (Windows NT 6.1 WOW64 rv:27.0) Gecko/20100101 Firefox/27.0')
				.open(url)
				.evaluate(function () {
					return document.getElementsByTagName('body')[0].innerHTML
				})
				.then(function (actualHtml1) {
					// console.log(1, actualHtml1)
					// get rid of browsersync js that <script> with paths
					// that differ between OSX/Linux/win
					actualHtml1 = actualHtml1.split('\n')[3]
					expect(expectedHtml1).to.equal(actualHtml1)
					writeState(1)
				})
				.wait(500)
				.evaluate(function () {
					return document.getElementsByTagName('body')[0].innerHTML
				})
				.then(function (actualHtml2) {
					// console.log(2, actualHtml2)
					// get rid of browsersync js that <script> with paths
					// that differ between OSX/Linux/win
					actualHtml2 = actualHtml2.split('\n')[3]
					expect(expectedHtml2).to.equal(actualHtml2)
					done()
				})
				.close()
			}, 1000)
		})
	})
})
