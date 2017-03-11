const fs = require('fs')
const path = require('path')
const http = require('http')

const chai = require('chai')

const expect = chai.expect

const relinker = require('./relinker')({})

describe('relinker', () => {
	it('should be able to load html into cheerio', () => {
		const expected = relinker('<body><div><a href="some/dir/markdown-link-1.html">markdown-link-1</a><a href="markdown-link-2.html">markdown-link-2</a><a href="markdown-link-3.htm">markdown-link-3</a></div></body>')
		const actual = relinker('<body><div><a href="some/dir/markdown-link-1.md">markdown-link-1</a><a href="markdown-link-2.md">markdown-link-2</a><a href="markdown-link-3.htm">markdown-link-3</a></div></body>')
		expect(actual).to.equal(expected)
	})

	// it('should throw an error with bad html', done => {
	// 	console.log(relinker)
	// 	done()
	// })
})
		// require('app/markserv')(argv).then(markserv => {
		// 	// console.log(markserv)

		// 	// should initialize
		// 	expect(markserv.initialized).to.be.a('boolean')
		// 	expect(markserv.initialized).to.equal(true)
		// 	expect(markserv.MarkconfJs).to.be.an('object')

		// 	const expectedHtml = fs.readFileSync(path.join(__dirname, 'expected.html'), 'utf8')

		// 	http.get({port: markserv.httpServer.port})
		// 	.on('response', res => {
		// 		res.setEncoding('utf8')
		// 		res.on('data', data => {
		// 			// console.log(data)
		// 			// console.log(expectedHtml)
		// 			expect(data).to.equal(expectedHtml)

		// 			markserv.shutdown(markserv)

		// 			done()
		// 		})
		// 	})
		// 	.on('error', err => {
		// 		console.error(err)
		// 		done()
		// 	})
		// })
