const fs = require('fs')
const path = require('path')

const chai = require('chai')
const rimraf = require('rimraf')

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

const expectedMd1 = fs.readFileSync(path.join(__dirname, 'expected1.md'), 'utf8')
const expectedMd2 = fs.readFileSync(path.join(__dirname, 'expected2.md'), 'utf8')
const expectedPath1 = path.join(__dirname, 'dest/a/deeper/deeper.md')
const expectedPath2 = path.join(__dirname, 'dest/b/test.md')

const read = path => {
	return fs.readFileSync(path, 'utf8').toString()
}

describe('watch html file (browserSync/cokidar)', () => {
	it('should reload page when file changes', function (done) {
		const timeout = 10 * 1000
		this.timeout(timeout)
		rimraf.sync(path.join(__dirname, 'dest'))

		require('app/markserv')(argv).then(markserv => {
			// console.log(markserv)

			expect(markserv.initialized).to.be.a('boolean')
			expect(markserv.initialized).to.equal(true)
			expect(markserv.MarkconfJs).to.be.an('object')

			setTimeout(() => {
				const actualMd1 = read(expectedPath1)
				const actualMd2 = read(expectedPath2)
				expect(actualMd1).to.equal(expectedMd1)
				expect(actualMd2).to.equal(expectedMd2)
				rimraf.sync(path.join(__dirname, 'dest'))
				done()
			}, 1000)
		})
	})
})
