const Markconf = {
	modifiers: {
		'**/*.*': [
			{
				module: 'markserv-contrib-mod.dir',
				templateUrl: 'partials/partial.html'
			}
		]
	}
};

module.exports = Markconf;
