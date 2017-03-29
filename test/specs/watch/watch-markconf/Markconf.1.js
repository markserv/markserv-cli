const Markconf = {

	modifiers: {
		'**/': 'markserv-contrib-mod.dir',
		'**/*.html': 'markserv-contrib-mod.html'
	},

	watch: {
		files: [
			'**/*.html'
		]
	}
}

module.exports = Markconf
