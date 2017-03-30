const Markconf = {
	modifiers: {
		'**/': 'markserv-contrib-mod.dir',
		'**/*.html': 'custom-modifier'
	},
	watch: {
		Markconf: true
	}
}

module.exports = Markconf
