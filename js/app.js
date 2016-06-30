var intervalMillis = 15 * 1000 //15 seconds
var timerToken = 0
var sessionEndTimeMillis
var nanobar

function generateID(length) {
  var ALPHABET = '23456789abdegjkmnpqrvwxyz';
  var rtn = '';
  for (var i = 0; i < length; i++) {
    rtn += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return rtn;
}

$(function() { //on load
  //carousel
  $('#myCarousel').carousel({
    interval: false
  })

  Dropzone.autoDiscover = false;
  // Get the template HTML and remove it from the document
  var previewNode = document.querySelector("#template");
  var previewTemplate = previewNode.outerHTML;
  previewTemplate.id = ""
  previewNode.parentNode.removeChild(previewNode);

  var myDropzone = new Dropzone('footer', {
    url: "/addSessionResource?eventId=" + eventId,
    // Set the url
    paramName: "file", // The name that will be used to transfer the file
    method: "post",
    HiddenFilesPath: 'body',
    createImageThumbnails: true,
    uploadMultiple: false,
    thumbnailWidth: 150,
    thumbnailHeight: 150,
    parallelUploads: 20,
    previewTemplate: previewTemplate,
    acceptedMimeTypes: "image/bmp,image/gif,image/jpg,image/jpeg,image/png",
    autoProcessQueue: true,
    previewsContainer: ".dropzone-previews", // Define the container to display the previews
    clickable: ".fileinput-thumbnail", // Define the element that should be used as click trigger to select files.
    //accept: dropzoneAccept
  });

  myDropzone.on("sending", function(file, xhr, formData) {
    console.log("dropzone sending")
    formData.append('eventId', eventId);
  });

  //nanobar
  nanobar = new Nanobar({
    id: "event-progress-nanobar",
    className: "nanobar"
  });

  nanobar.go(0)
})

function triggerSessionStart() {
  $.post("/beginSession", {
      eventId: eventId
    },
    function(result) {
      if (result.result === "begin") {
        session.signal({
          type: "beginSession",
          proposedStartTimeMillis: result.proposedStartTimeMillis
        })
      }
    })
}

function start() {
  console.log('SESSION START')
  timerToken = window.setInterval(tick, intervalMillis)
  console.log("timer: " + timerToken)
  tick()
}

function stop() {
  console.log('SESSION STOP')
  if (typeof timerToken != "undefined") {
    console.log("stopping timer: " + timerToken)
    window.clearInterval(timerToken)
  }
}

function tick() {
  //recalc timeRemaining
  var nowMillis = Date.now()
  timeRemainingMillis = sessionEndTimeMillis - nowMillis
  var timeRemainingPercent = (timeRemainingMillis / sessionDurationMillis) * 100
  console.log("timeRemainingPercent: " + timeRemainingPercent)
    //is the session over?
  if (timeRemainingPercent <= 0) {
    nanobar.go(100)
    stop()
  } else {
    nanobar.go(100 - timeRemainingPercent)
      //is it nearly over? 5% or 5 minutes
    if ((timeRemainingPercent < 5) || timeRemainingMillis <= 5 * 60 * 1000) {

      //set the warn class on the nanobar
      $('#event-progress-nanobar').removeClass('alarm').addClass('warn')
    }
    //is it very nearly over? 1% or 1 minute
    if ((timeRemainingPercent < 1) || timeRemainingMillis <= 1 * 60 * 1000) {
      $('#event-progress-nanobar').removeClass('warn').addClass('alarm')
    }

    //update the clock
    $('#event-progress-clock').addClass('alarm')

  }

  var timeRemainingHuman = moment.duration(timeRemainingMillis).humanize()
  $('#countdownClock').text(timeRemainingHuman)
}

function resizeImage(url, width, height, callback, file) {
  var sourceImage = new Image();
  sourceImage.crossOrigin = "anonymous"

  sourceImage.onload = (function(f) {
    return function(evt) {
      var canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      if (sourceImage.width == sourceImage.height) {
        canvas.getContext("2d").drawImage(sourceImage, 0, 0, width, height);
      } else {
        minVal = Math.min(sourceImage.width, sourceImage.height);
        if (sourceImage.width > sourceImage.height) {
          canvas.getContext("2d").drawImage(sourceImage, (sourceImage.width - minVal) / 2, 0, minVal, minVal, 0, 0, width, height);
        } else {
          canvas.getContext("2d").drawImage(sourceImage, 0, (sourceImage.height - minVal) / 2, minVal, minVal, 0, 0, width, height);
        }
      }
      callback(canvas.toDataURL(), f);
    }
  })(file);

  sourceImage.src = url;
}
