const Markconf = {

	// import: 'markserv-contrib-app.github',
	modifiers: {
		'**/': 'markserv-contrib-mod.dir',
		'**/*.html': 'markserv-contrib-mod.html'
	},

	watch: {
		files: [
			// '**/*.html'
		]
	}
};

module.exports = Markconf;
