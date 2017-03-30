const Markconf = {
	modifiers: {
		'**/': 'markserv-contrib-mod.dir',
		// modifiers dont reload?
		'**/*.html': 'custom-modifier'
	},
	watch: {
		Markconf: true
	}
}

module.exports = Markconf
