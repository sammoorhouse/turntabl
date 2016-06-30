var intervalMillis = 15 * 1000 //15 seconds
var timerToken = 0
var sessionEndTimeMillis
var nanobar

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

  eventResources.forEach(function(resource) {
    addServerFile(myDropzone, resource.name, resource.url)
  })

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

function addServerFile(dropzone, imageName, url) {
  // Create the mock file:
  var mockFile = {
    name: imageName,
    size: 12345
  };

  // Call the default addedfile event handler
  dropzone.emit("addedfile", mockFile);
  dropzone.createThumbnailFromUrl(mockFile, "//" + url);
  dropzone.emit("complete", mockFile);
}
