const Markconf = {
	modifiers: {
		'**/': 'markserv-contrib-mod.dir'
	},

	overrides: {
		dir: 'foo',
		files: [
			{
				path: '#',
				name: 'bar',
				class: 'file'
			}
		]
	}
};

module.exports = Markconf;
