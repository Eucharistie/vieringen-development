// Helper function that creates spans with tag-ids around words
function splitWords() {
	let id = 0
	const textNodes = getAllTextNodes()
	for (const node of textNodes) {
		if (node.textContent.length > 0) {
			const fragment = document.createDocumentFragment()
			for (const text of node.textContent.split(/\s+/)) {
				if (text.length > 0) {
					const span = document.createElement('span')
					span.innerHTML = text + ' '
					span.classList.add('tagged')
					span.classList.add(`tag-${id}`)
					id += 1
					fragment.appendChild(span);
				}
			}
			node.parentNode.replaceChild(fragment, node)
		}
	}
}

function getAllTextNodes() {
	const xpath = ".//text()"
	const evaluator = new XPathEvaluator();
	const expression = evaluator.createExpression(xpath);
	const textNodes = []
	const textNodeIterator = expression.evaluate(textContainer, XPathResult.ORDERED_NODE_ITERATOR_TYPE)
	let node;
	while (node = textNodeIterator.iterateNext()) {
			textNodes.push(node)
	}
	return textNodes
}

const containsText = /\S/

function tagText() {
	let id = 0
	const textNodes = getAllTextNodes()
	for (const node of textNodes) {
		const text = node.textContent
		if (containsText.test(text)) {
			const span = document.createElement('span')
			span.innerHTML = text
			span.classList.add('tagged')
			span.classList.add(`tag-${id}`)
			id += 1
			node.parentNode.replaceChild(span, node)
		}
	}
}