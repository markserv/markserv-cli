const chai = require('chai')

const expect = chai.expect

const log = require('app/lib/core/log')
const relinker = require('app/lib/http/relinker')

log.setLevel('OFF')

describe('relinker', () => {
	it('should be able to relink .md links as .html', function (done) {
		const expected = '<body><div><a href="some/dir/markdown-link-1.html">markdown-link-1</a><a href="markdown-link-2.html">markdown-link-2</a><a href="markdown-link-3.htm">markdown-link-3</a></div></body>'

		relinker('<body><div><a href="some/dir/markdown-link-1.md">markdown-link-1</a><a href="markdown-link-2.md">markdown-link-2</a><a href="markdown-link-3.htm">markdown-link-3</a></div></body>')
		.then(actual => {
			expect(actual).to.equal(expected)
			done()
		})
	})
})
