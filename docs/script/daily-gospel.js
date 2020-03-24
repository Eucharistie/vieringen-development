downloadDayInfo(getQueryStringValue('date'), showReadings)
const videoId = getQueryStringValue('youtubeID');

function downloadDayInfo(date, completionCallback) {
    const request = new XMLHttpRequest()
	request.addEventListener('load', load)
    request.open("GET", `https://publication.evangelizo.ws/NL/days/${date}`)
    request.setRequestHeader("Accept", "application/json, text/plain, */*")
	request.send()
	console.log('donwloading', '2020-03-24')
	
	function load() {
		if (request.status == 200) {
			try {
                const dayInfo = JSON.parse(this.responseText)
				completionCallback(dayInfo.data)
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

function showReadings(info) {
    const readings = parseReadings(info)
    const text = typesetReadings(readings)
    if (document.readyState == "complete") {
        replaceText(text)
    } else {
        try { replaceText(text) } catch (error) {}
        document.addEventListener('load', function() {
            replaceText(text)
        })
    }
}

function replaceText(text) {
    const massText = document.querySelector('.mass-text')
    massText.innerHTML = ''
    massText.appendChild(text)
}

const tagExpression = /\[\[(\w+) (\d+),(\d+)([a-z]*)\]\]/g

function parseReadings(dayInfo) {
    const readings = []
    if (dayInfo && dayInfo.readings && dayInfo.readings.length > 0) {
        for (const reading of dayInfo.readings) {
            const verses = []
            const finder = new RegExp(tagExpression)
            let lastGroups = finder.exec(reading.text)
            let cursor = finder.lastIndex
            let groups;
            while ((groups = finder.exec(reading.text)) !== null) {
                verses.push(verseInfo(reading.text.indexOf('[', cursor)))
                cursor = finder.lastIndex
                lastGroups = groups
            }
            verses.push(verseInfo())
            readings.push( {type: reading.type, verses, ...generateTitle(reading)} )

            function verseInfo(end) {
                const [ref, book, chapter, verse, subdivision] = lastGroups
                const text = reading.text.substring(cursor, end)
                return {
                    book, chapter, verse, subdivision,
                    content: text
                }
            }        
        }
    }

    return readings;

    function generateTitle(reading) {
        if (reading.type == 'psalm') {
            return {title: reading.title}
        } else if (reading.type == 'gospel') {
            return {title: 'Evangelie'}
        } else {
            const number = readings.reduce(counter, 1)
            return {
                title: ordinalsInDutch[number] + ' lezing',
                origin: reading.title
            }
        }
        function counter(number, reading) {
            return reading.type == 'reading' ? number+1 : number;
        }
    }
}

function typesetReadings(readings) {
    const fragment = document.createDocumentFragment()
    for (const reading of readings) {
        const header = document.createElement('h3')
        fragment.appendChild(header)
        header.innerHTML = reading.title
        const paragraph = document.createElement('p')
        fragment.appendChild(paragraph)
        for (const verse of reading.verses) {
            const span = document.createElement('span')
            paragraph.appendChild(span)
            span.innerHTML = verse.content.replace('\n', '<br/>')
        }
    }
    console.log(fragment)
    return fragment
}

const ordinalsInDutch = ["Geen", "Eerste", "Tweede", "Derde", "Vierde", "Vijfde", "Zesde", "Zevende"]


function getQueryStringValue (key) {  
    return decodeURIComponent(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));  
}