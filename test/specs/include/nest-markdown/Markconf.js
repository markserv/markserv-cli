const Markconf = {
	includers: {
		html: 'markserv-contrib-inc.html',
		markdown: 'markserv-contrib-inc.markdown'
	},

	modifiers: {
		'**/': [
			{
				module: 'markserv-contrib-mod.dir',
				templateUrl: 'partials/level-1.html'
			}
		]
	}
};

module.exports = Markconf;
