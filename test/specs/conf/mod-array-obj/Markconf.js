const Markconf = {
	modifiers: {
		'**/*.*': [
			{
				module: 'markserv-contrib-mod.dir',
				template: 'partials/partial.html'
			}
		]
	}
};

module.exports = Markconf;
