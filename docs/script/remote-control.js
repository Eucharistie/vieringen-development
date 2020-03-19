window.addEventListener('keydown', function(event) {	
	if (event.key == "Meta") {
		document.documentElement.classList.add('control')
	}
})

window.addEventListener('keyup', function(event) {
	if (event.key == "Meta") {
		document.documentElement.classList.remove('control')
	}
})