const Markconf = {

	modifiers: {
		'**/': 'markserv-contrib-mod.dir',
		'**/*.html': 'custom-modifier.js'
	},

	watch: {
		files: [
			'**/*.html'
		]
	}
}

module.exports = Markconf
