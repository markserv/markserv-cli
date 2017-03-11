const path = require('path')

const cheerio = require('cheerio')

const validate = require('app/lib/http/validate')

const helpFs = require('app/lib/help/fs')({
	MarkconfDefaults: {
		fileTypes: {
			markdown: [
				'.md',
				'.markdown',
				'.mdown',
				'.mkdn',
				'.mkd',
				'.mdwn',
				'.mdtxt',
				'.mdtext',
				'.text'
			]
		}
	}
})

let $DOM
let $rootElem

const isAnchor = node => {
	const hasType = Reflect.has(node, 'type')
	const hasName = Reflect.has(node, 'name')
	const isA = node.name === 'a'

	if (!hasType || !hasName || !isA) {
		return false
	}

	return true
}

const isMarkdownHref = anchor => {
	const hasAttribs = Reflect.has(anchor, 'attribs')
	const hasHref = Reflect.has(anchor.attribs, 'href')
	const isMarkdownLink = helpFs.isMarkdownFile(anchor.attribs.href)

	if (!hasAttribs || !hasHref || !isMarkdownLink) {
		return false
	}

	return true
}

const relinkHref = anchor => {
	const href = anchor.attribs.href
	const file = path.parse(href)
	const newHref = path.join(file.dir, file.name + '.html')
	anchor.attribs.href = newHref
	return anchor
}

const filter = node => {
	if (typeof node !== 'object' || !Reflect.has(node, 'children')) {
		return node
	}

	node.childNodes.forEach(childNode => {
		const anchor = isAnchor(childNode) && isMarkdownHref(childNode)

		if (anchor) {
			return relinkHref(childNode)
		}

		childNode = filter(childNode)
	})

	return node
}

const relinker = (htmlString, src) => new Promise((resolve, reject) => {
	validate(htmlString, src).then(() => {
		$DOM = cheerio.load(htmlString)
		$rootElem = $DOM._root
		filter($rootElem)
		resolve($DOM.html())
	}).catch(err => {
		reject(err)
	})
})

module.exports = relinker
