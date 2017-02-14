const Markconf = {
	import: 'markserv-contrib-app.github',

	overrides: {
		MarkconfUr: __filename
	},

	watch: {
		Markconf: true,
		plugins: true,
		files: [
			'**/*.md'
		]
	}
};

module.exports = Markconf;
