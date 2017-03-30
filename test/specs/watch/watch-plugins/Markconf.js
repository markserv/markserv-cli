const Markconf = {
	modifiers: {
		'**/': 'markserv-contrib-mod.dir',
		'**/*.html': 'custom-modifier.js'
	},
	watch: {
		plugins: true
	}
}

module.exports = Markconf

