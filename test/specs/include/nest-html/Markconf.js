const Markconf = {
	includers: {
		html: 'markserv-contrib-inc.html'
	},

	modifiers: {
		'**/': [
			{
				module: 'markserv-contrib-mod.dir',
				template: 'partials/level-1.html'
			}
		]
	}
};

module.exports = Markconf;
