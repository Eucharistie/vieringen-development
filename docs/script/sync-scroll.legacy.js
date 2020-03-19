function onYouTubeIframeAPIReady() {
  console.log('api is ready');
  var player = new YT.Player('player', {
    height: '360',
    width: '640',
    videoId: videoId,
    //live: 5RvOtmhrt1k
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    },
    playerVars: {
      playsinline: 1
    }
  });
  window.ytPlayer = player;
}

function onPlayerReady(event) {
  // Make text clickable to synchronize the video to the text. See logTag
  if (textContainer == null) textContainer = document.querySelector('section.mass-text');

  var _loop = function _loop() {
    if (_isArray) {
      if (_i >= _iterator.length) return "break";
      _ref = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) return "break";
      _ref = _i.value;
    }

    var node = _ref;
    var start = node.className.indexOf('tag-');
    var next = node.className.indexOf(' ', start);
    var end = next == -1 ? node.className.length : next;
    var id = parseInt(node.className.substr(start + 4, end));
    node.addEventListener('click', function (click) {
      return logTag(id, event.target.getCurrentTime());
    });
  };

  for (var _iterator = textContainer.querySelectorAll('.tagged'), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref;

    var _ret = _loop();

    if (_ret === "break") break;
  }
}

var tags = [];

function logTag(id, time) {
  var log = {
    id: id,
    time: time
  };
  tags.push(log);
  console.log(log);
}

var syncInterval = null;
var lastTagIndex = 0;

function onPlayerStateChange(event) {
  clearInterval(syncInterval); // When the player starts playing
  // start polling the youtube time and lookup corresponding tag

  if (event && event.data == 1) {
    syncInterval = setInterval(function () {
      var time = event.target.getCurrentTime();
      var newIndex = findTagIndex(downloadedTimeline, time);

      if (newIndex != lastTagIndex) {
        if (newIndex == -1) textContainer.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });else scrollText(newIndex);
      }

      lastTagIndex = newIndex;
    }, 100);
  }
} // Given a sorted array of timecodes, get the timecode before a given point


function findTagIndex(timeline, time) {
  return binarySearch(timeline.length, function (index) {
    return time < timeline[index].time;
  }) - 1;
} // Scroll to the tag given by its index in the downloaded timeline


function scrollText(tagIndex) {
  var node = downloadedTimeline[tagIndex].node;
  textContainer.scrollTo({
    left: 0,
    top: stickyOffsetFor(node),
    behavior: 'smooth'
  });
} // Calculate the scrollOffset to a node


function stickyOffsetFor(node) {
  var parent = node; // basic offset calculation

  var offset = node.getBoundingClientRect().top - textContainer.firstElementChild.getBoundingClientRect().top; // If there is a sticky element adjust offset. Otherwise return the basic offset

  var h3 = false;

  while (parent.parentElement) {
    parent = parent.parentElement; // If it's a header, remember this for later

    if (parent.tagName.toLowerCase() == 'h3') h3 = parent; // If it's a sticking node itself

    if (parent.classList.contains('stick')) {
      return measureNonSticking(parent); // Early exit
    } // If there is a sticky title on top, find it and add it's height to offset, then do an early exit


    if (parent.classList.contains('sticky-container')) {
      if (h3) return measureNonSticking(h3);
      var sticker = parent.querySelector('.stick, h3');

      if (sticker) {
        var bounds = sticker.getBoundingClientRect();
        return offset - bounds.height - 10;
      }
    }
  } // return basic offset


  return offset;
}

function measureNonSticking(node) {
  // Disable stickyness and return element to its original non-sticky position
  node.classList.add('js-measurement'); // Measure position

  var offset = node.getBoundingClientRect().top - textContainer.firstElementChild.getBoundingClientRect().top; // Enable stickyness again

  node.classList.remove('js-measurement');
  return offset;
}

var textContainer = null;
window.addEventListener('load', function () {
  textContainer = document.querySelector('section.mass-text');

  if (staticTimeline && staticTimeline.length > 1) {
    // When processed use the published staticTimeline
    appendRawTimeline(staticTimeline);
  } else {
    // When live download live partial files
    setInterval(downloadRemainingParts, 30000);
    downloadRemainingParts();
  }
});
var timelinePartsDownloaded = 0;
var downloadedTimeline = [];
var timelineDownloader = null;

function downloadRemainingParts() {
  downloadPartialTimeline(timelinePartsDownloaded, tryToDownloadNext);

  function tryToDownloadNext() {
    timelinePartsDownloaded += 1;
    downloadRemainingParts();
  }
}

function appendRawTimeline(timeline) {
  for (var _iterator2 = timeline, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
    var _ref2;

    if (_isArray2) {
      if (_i2 >= _iterator2.length) break;
      _ref2 = _iterator2[_i2++];
    } else {
      _i2 = _iterator2.next();
      if (_i2.done) break;
      _ref2 = _i2.value;
    }

    var _ref3 = _ref2,
        id = _ref3.id,
        time = _ref3.time;
    var node = document.querySelector(".tag-" + id);
    downloadedTimeline.push({
      id: id,
      time: time,
      node: node
    });
  }
}

function downloadPartialTimeline(partIndex, completionCallback) {
  var request = new XMLHttpRequest();
  request.addEventListener('load', load);
  request.open("GET", new URL("timeline/" + partIndex + ".json", document.baseURI).href);
  request.send();
  console.log('donwloading', partIndex);

  function load() {
    if (request.status == 200) {
      try {
        var _tags = JSON.parse(this.responseText);

        appendRawTimeline(_tags);
        completionCallback();
      } catch (error) {
        console.error(error);
      }
    } else if (request.status == 404) {
      console.log("timeline " + partIndex + " does not exist (yet)");
    } else {
      console.error('unexpected status code', request.status);
    }
  }
}
/*
 * Return i such that !pred(i - 1) && pred(i) && 0 <= i <= length.
 */


function binarySearch(length, pred) {
  var lo = -1,
      hi = length;

  while (1 + lo < hi) {
    var mi = lo + (hi - lo >> 1);
    if (pred(mi)) hi = mi;else lo = mi;
  }

  return hi;
}