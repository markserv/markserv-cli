const chai = require('chai')

const expect = chai.expect

const argv = [null, null,
	// Use the Markconf file from this spec directory
	'-c', __dirname,
	// Turn off the logger for testing
	'-l', 'OFF'
]

describe('concurrent server 2', () => {
	it('should initialize', done => {
		require('app/markserv')(argv).then(markserv => {
			// console.log(markserv)

			expect(markserv.initialized).to.be.a('boolean')
			expect(markserv.initialized).to.equal(true)
			markserv.shutdown(markserv, done)
		})
	})
})
