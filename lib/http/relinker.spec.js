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
})
