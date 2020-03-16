function onYouTubeIframeAPIReady() {
	console.log('api is ready')
	const player = new YT.Player('player', {
		height: '360',
		width: '640',
		videoId: 'XjVYjhIsOjs', //live: 5RvOtmhrt1k
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
			const newIndex = findTagIndex(staticTimeline, time)
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

// Scroll to the tag given by its index in staticTimeline
function scrollText(tagIndex) {
	const node = staticTimeline[tagIndex].node
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
	while (parent.parentElement) {
		parent = parent.parentElement
		// If it's a sticking node itself
		if (parent.classList.contains('stick') || parent.cl) {
			// Disable stickyness and return element to its original non-sticky position
			parent.classList.add('js-measurement')
			// Measure position
			const offset = parent.getBoundingClientRect().top - textContainer.firstElementChild.getBoundingClientRect().top
			// Enable stickyness again
			parent.classList.remove('js-measurement')
			// Early exit
			return offset
		}
		// If there is a sticky title on top, find it and add it's height to offset, then do an early exit
		if (parent.classList.contains('sticky-container')) {
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

let tagElements = []
let textContainer = null
window.addEventListener('load', function() {
	tagElements = Array.from(document.querySelectorAll('.tag'))
	textContainer = document.querySelector('section.mass-text')
	for (let index=0; index < staticTimeline.length; index++) {
		staticTimeline[index].node = document.querySelector(`.tag-${staticTimeline[index].id}`)
	}
})

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
