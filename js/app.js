var intervalMillis = 15 * 1000 //15 seconds
var timerToken = 0
var sessionEndTimeMillis
  /*var pusher = new Pusher('45387f244d056952dda4', {
    encrypted: true
  });*/
var nanobar

//var presenceChannel

// Enable pusher logging - don't include this in production
//Pusher.logToConsole = true;

$(function() { //on load
  //carousel
  $('#myCarousel').carousel({
      interval: false
    })
    //dropzone


  Dropzone.autoDiscover = false;
  // Get the template HTML and remove it from the document
  var previewNode = document.querySelector("#template");
  var previewTemplate = previewNode.outerHTML;
  previewTemplate.id = ""
  previewNode.parentNode.removeChild(previewNode);

  var myDropzone = new Dropzone('footer', {
    url: "/addSessionResource", // Set the url
    method: "post",
    createImageThumbnails: false,
    thumbnailWidth: 150,
    thumbnailHeight: 150,
    parallelUploads: 20,
    previewTemplate: previewTemplate,
    acceptedMimeTypes: "image/bmp,image/gif,image/jpg,image/jpeg,image/png",
    autoProcessQueue: true,
    previewsContainer: ".dropzone-previews", // Define the container to display the previews
    //clickable: ".fileinput-thumbnail", // Define the element that should be used as click trigger to select files.
    //accept: dropzoneAccept
  });

  function dropzoneAccept(file, done) {
    console.log("dropzone accept: " + file)
    file.postData = [];
    $.ajax({
      url: "/sign-s3",
      data: {
        name: file.name,
        type: file.type,
        size: file.size
      },
      success: function jQAjaxSuccess(response) {
        response = JSON.parse(response);
        file.custom_status = 'ready';
        file.postData = response;
        file.s3 = response.key;
        $(file.previewTemplate).addClass('uploading');
        done();
      },
      error: function(response) {
        file.custom_status = 'rejected';
        if (response.responseText) {
          response = JSON.parse(response.responseText);
        }
        if (response.message) {
          done(response.message);
          return;
        }
        done('error preparing the upload');
      }
    })
  }

  /*
    myDropzone.on("sending", function(file, xhr, formData) {
      console.log("dropzone sending")
      $.each(file.postData, function(k, v) {
        formData.append(k, v);
      });

      formData.append('Content-type', '');
      formData.append('Content-length', '');
      formData.append('acl', 'public-read');
    });
    myDropzone.on("complete", function(file) {
      console.log("dropzone complete")

      $.post("/addSessionResource", {
          s3Key: file.s3,
          fileType: file.type,
          filename: file.name,
          eventId: eventId
        },
        function(result) {
          if (result.action === "split") {
            //the file has been split into sections; figure it out
          })
      }
    })
  });
  */

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
