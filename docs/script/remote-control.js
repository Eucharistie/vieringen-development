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
	
	// Make text clickable to synchronize the video to the text. See storeTag
	for (const node of massText.querySelectorAll('.tagged')) {
		const start = node.className.indexOf('tag-')
		const next = node.className.indexOf(' ', start)
		const end = next == -1 ? node.className.length : next;
		const id = parseInt(node.className.substr(start + 4, end))
		node.addEventListener('click', click => linkTag(id, node))
	}
	document.body.appendChild(timecodePreview)
}

function linkTag(id, node) {
	if (isInLiveMode) {
		const playerTime = (Date.now() - liveStartTime)/1000
		storeTag(id, playerTime, node)
	} else {
		storeTag(id, window.ytPlayer.getCurrentTime(), node)
	}
}

const tags = []
function storeTag(id, time, node) {
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
	if (isInLiveMode && nextUpload === null) {
		nextUpload = setTimeout(uploadTimeline, 4000)
	}
}

let nextUpload = null
function uploadTimeline() {
	nextUpload = null
	console.log("sending timeline")
	const timeline = tags.map(({id, time}) => ({id, time})).sort((left, right) => left.time - right.time)
	window.webkit.messageHandlers.storeTimeline.postMessage(JSON.stringify(timeline))
}

let isInLiveMode = false
function toggleLiveMode(isOn) {
	isInLiveMode = isOn
	if (isOn) document.body.classList.add('live-mode')
	else document.body.classList.remove('live-mode')
}

const timecodePreview = document.createElement('div')
timecodePreview.className = 'timecode-preview'
let liveStartTime = Date.now()
let timecodePreviewUpdater = setInterval(updateTimePreview, 500)

function setLiveStartTime(timecode) {
	liveStartTime = timecode
	console.log('changing timecode', timecode)
}

function updateTimePreview() {
	timecodePreview.innerHTML = Math.round((Date.now() - liveStartTime) / 1000)
}