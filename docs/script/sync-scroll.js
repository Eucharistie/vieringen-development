function onYouTubeIframeAPIReady() {
	console.log('api is ready')
	const player = new YT.Player('player', {
		height: '360',
		width: '640',
		videoId, //live: 5RvOtmhrt1k
		events: {
			'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange
		},
		playerVars: {
			playsinline: 1
		}
	});
	window.ytPlayer = player
}

function onPlayerReady(event) {
	// Make text clickable to synchronize the video to the text. See logTag
	if (textContainer == null) textContainer = document.querySelector('section.mass-text')
	for (const node of textContainer.querySelectorAll('.tagged')) {
		const start = node.className.indexOf('tag-')
		const next = node.className.indexOf(' ', start)
		const end = next == -1 ? node.className.length : next;
		const id = parseInt(node.className.substr(start + 4, end))
		node.addEventListener('click', click => logTag(id, event.target.getCurrentTime()))
	}
}

const tags = []
function logTag(id, time) {
	const log = {id, time}
	tags.push(log)
	console.log(log)
}


let syncInterval = null
let lastTagIndex = 0
function onPlayerStateChange(event) {
	clearInterval(syncInterval)

	// When the player starts playing
	// start polling the youtube time and lookup corresponding tag
	if (event && event.data == 1) {
		syncInterval = setInterval(function() {
			const time = event.target.getCurrentTime()
			const newIndex = findTagIndex(downloadedTimeline, time)
			if (newIndex == -1) textContainer.scrollTo({top:0, left:0, behavior: 'smooth'})
			else if (newIndex != lastTagIndex) {scrollText(newIndex)}
			lastTagIndex = newIndex
		}, 100)
	}
}			

// Given a sorted array of timecodes, get the timecode before a given point
function findTagIndex(timeline, time) {
	return binarySearch(timeline.length, index => time < timeline[index].time) - 1
}

// Scroll to the tag given by its index in the downloaded timeline
function scrollText(tagIndex) {
	const node = downloadedTimeline[tagIndex].node
	textContainer.scrollTo({
		left: 0,
		top: stickyOffsetFor(node),
		behavior: 'smooth'
	})
}

// Calculate the scrollOffset to a node
function stickyOffsetFor(node) {
	let parent = node
	// basic offset calculation
	const offset = node.getBoundingClientRect().top - textContainer.firstElementChild.getBoundingClientRect().top

	// If there is a sticky element adjust offset. Otherwise return the basic offset
	let h3 = false
	while (parent.parentElement) {
		parent = parent.parentElement
		// If it's a header, remember this for later
		if (parent.tagName.toLowerCase() == 'h3') h3 = parent
		// If it's a sticking node itself
		if (parent.classList.contains('stick')) {
			return measureNonSticking(parent) // Early exit
		}
		// If there is a sticky title on top, find it and add it's height to offset, then do an early exit
		if (parent.classList.contains('sticky-container')) {
			if (h3) return measureNonSticking(h3)
			
			let sticker = parent.querySelector('.stick, h3')
			if (sticker) {
				const bounds = sticker.getBoundingClientRect()
				return offset - bounds.height - 10
			}
		}
	}

	// return basic offset
	return offset
}

function measureNonSticking(node) {
	// Disable stickyness and return element to its original non-sticky position
	node.classList.add('js-measurement')
	// Measure position
	const offset = node.getBoundingClientRect().top - textContainer.firstElementChild.getBoundingClientRect().top
	// Enable stickyness again
	node.classList.remove('js-measurement')
	return offset
}

let textContainer = null
window.addEventListener('load', function() {
	textContainer = document.querySelector('section.mass-text')
	setInterval(downloadRemainingParts, 30000)
	downloadRemainingParts()
})

var timelinePartsDownloaded = 0
const downloadedTimeline = []
let timelineDownloader = null
function downloadRemainingParts() {
	downloadPartialTimeline(timelinePartsDownloaded, tryToDownloadNext)
	
	function tryToDownloadNext() {
		timelinePartsDownloaded += 1
		downloadRemainingParts()
	}
}

function downloadPartialTimeline(partIndex, completionCallback) {
	const request = new XMLHttpRequest()
	request.addEventListener('load', load)
	request.open("GET", new URL(`timeline/${partIndex}.json`, document.baseURI).href)
	request.send()
	console.log('donwloading', partIndex)
	
	function load() {
		if (request.status == 200) {
			try {
				const tags = JSON.parse(this.responseText)
				for (const {id, time} of tags) {
					const node = document.querySelector(`.tag-${id}`)
					downloadedTimeline.push({id, time, node})
				}
				completionCallback()
			} catch (error) {
				console.error(error)
			}
		} else if (request.status == 404) {
			console.log(`timeline ${partIndex} does not exist (yet)`)
		} else {
			console.error('unexpected status code', request.status)
		}
	}
}

/*
 * Return i such that !pred(i - 1) && pred(i) && 0 <= i <= length.
 */
function binarySearch(length, pred) {
	let lo = -1, hi = length;
	while (1 + lo < hi) {
		const mi = lo + ((hi - lo) >> 1);
		if (pred(mi)) hi = mi;
		else lo = mi;
	}
	return hi;
}
