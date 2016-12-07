module.exports = config => {
	const helpers = {
		fs: require('app/lib/help/fs')(config)
	};

	return helpers;
};
