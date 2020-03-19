window.addEventListener('load', init)

function init() {
	const massText = document.querySelector('section.mass-text')
	console.log(massText)
	
	let isInControlMode = false
	
	window.addEventListener('keydown', function(event) {	
		if (event.key == "Meta") {
			document.documentElement.classList.add('control')
			isInControlMode = true
		}
	})

	window.addEventListener('keyup', function(event) {
		if (event.key == "Meta") {
			document.documentElement.classList.remove('control')
			isInControlMode = false
		}
	})
	
	// Make text clickable to synchronize the video to the text. See logTag
	for (const node of massText.querySelectorAll('.tagged')) {
		const start = node.className.indexOf('tag-')
		const next = node.className.indexOf(' ', start)
		const end = next == -1 ? node.className.length : next;
		const id = parseInt(node.className.substr(start + 4, end))
		node.addEventListener('click', click => logTag(id, window.ytPlayer.getCurrentTime(), node))
	}
}

const tags = []
function logTag(id, time, node) {
	const existingIndex = tags.findIndex(tag => tag.id == id)
	if (existingIndex == -1) {
		const log = {id, time}
		tags.push(log)
		node.classList.add('linked')
		console.log(log)
	} else {
		tags.splice(existingIndex, 1)
		node.classList.remove('linked')
	}
}
