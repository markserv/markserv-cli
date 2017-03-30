module.exports = {
	name: 'custom-modifier',
	plugin: () => {
		return () => new Promise(resolve => {
			resolve({
				statusCode: 200,
				contentType: 'text/html',
				data: '<html><body><h1>Custom Modifier 1</h1></body></html>'
			})
		})
	}
}
