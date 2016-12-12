const Markconf = {
	modifiers: {
		'**/*.*': [
			{
				module: 'markserv-contrib-mod.dir',
				template: '<h1>INLINE TEMPLATE EXAMPLE</h1>'
			}
		]
	}
};

module.exports = Markconf;
