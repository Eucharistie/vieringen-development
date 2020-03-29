let dateString = getQueryStringValue('date')
if (dateString == "") {
    const now = new Date()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const year = now.getFullYear()
    const day = now.getDate().toString().padStart(2, '0')
    dateString = year + '-' + month + '-' + day
}
console.log('showing readings for', dateString)
downloadDayInfo(dateString, showReadings)


window.addEventListener('load', function() {
    const iframe = document.getElementById('player')
    iframe.src = 'https://www.youtube.com/embed/live_stream?playsinline=1&channel=' + getQueryStringValue('ytChannel')
})

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

    console.log(info)
    if (document.readyState == "complete") {
        replaceText(text, info.liturgic_title)
    } else {
        try { replaceText(text, info.liturgic_title) } catch (error) {}
        document.addEventListener('load', function() {
            replaceText(text, info.liturgic_title)
        })
    }
}

function replaceText(text, title) {
    const massText = document.querySelector('.mass-text')
    const titleElement = document.querySelector('h1')
    massText.innerHTML = ''
    massText.appendChild(text)
    titleElement.innerHTML = title
    document.title = title
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
        if (reading.type == 'reading' && reading.origin) {
            const originParagraph = paragraph.cloneNode(false);
            fragment.appendChild(originParagraph)
            originParagraph.innerHTML = reading.origin
        }
        fragment.appendChild(paragraph)
        for (const verse of reading.verses) {
            const lines = verse.content.split('\n')
            addLine(0)
            for (let i = 1; i<lines.length; i++) {
                const lineBreak = document.createElement('br')
                paragraph.appendChild(lineBreak)
                addLine(i)
            }
            function addLine(i) {
                const text = lines[i]
                if (text.length > 0) {
                    const span = document.createElement('span')
                    paragraph.appendChild(span)
                    span.innerHTML = text
                }
            }
        }
    }
    console.log(fragment)
    return fragment
}

const ordinalsInDutch = ["Geen", "Eerste", "Tweede", "Derde", "Vierde", "Vijfde", "Zesde", "Zevende"]


function getQueryStringValue (key) {  
    return decodeURIComponent(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));  
}