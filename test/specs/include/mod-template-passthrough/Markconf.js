const Markconf = {
	includers: {
		html: 'markserv-contrib-inc.html'
	},

	modifiers: {
		'**/': [
			{
				module: 'markserv-contrib-mod.dir',
				templateUrl: 'partials/outer.html'
			}
		]
	}
};

module.exports = Markconf;
