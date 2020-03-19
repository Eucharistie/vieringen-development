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
	
	massText.addEventListener('scroll', function(event) {
		console.log('scroll')
		if (isInControlMode) event.preventDefault();
	})
	
	// Make text clickable to synchronize the video to the text. See logTag
	if (textContainer == null) textContainer = document.querySelector('section.mass-text')
	for (const node of textContainer.querySelectorAll('.tagged')) {
		const start = node.className.indexOf('tag-')
		const next = node.className.indexOf(' ', start)
		const end = next == -1 ? node.className.length : next;
		const id = parseInt(node.className.substr(start + 4, end))
		node.addEventListener('click', click => logTag(id, window.ytPlayer.getCurrentTime()))
	}
}

const tags = []
function logTag(id, time) {
	const log = {id, time}
	tags.push(log)
	console.log(log)
}
