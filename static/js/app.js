var intervalMillis = 15 * 1000 //15 seconds
var timerToken = 0
var sessionEndTimeMillis
var nanobar

$(function () { //on load

    $(".dropdown-toggle").dropdown();
    $('.dropdown-menu > li').click(function() {
    var toggle = $(this).parent().siblings('.dropdown-toggle');
    $(toggle).html($(this).text() + "<span class=\"caret\"></span>")
});

var text_max = 50;
$('#count_message').html(text_max + " / " + text_max);

$('#sessionName').keyup(function() {
  var text_length = $('#sessionName').val().length;
  var text_remaining = text_max - text_length;
  
  $('#count_message').html(text_remaining + " / " + text_max);
});


//modal
// Get the modal
var modal = document.getElementById('myModal');

// Get the button that opens the modal
var btn = document.getElementById("myBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on the button, open the modal 
//btn.onclick = function() {
    modal.style.display = "block";
//}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
    



  //carousel
  $('#myCarousel').carousel({
    interval: false
  })

  var chatTemplateNode = document.querySelector("#chat-message-template");
  var chatTemplate = chatTemplateNode.outerHTML;
  chatTemplate.id = ""
  chatTemplateNode.parentNode.removeChild(chatTemplateNode)

  Dropzone.autoDiscover = false;
  // Get the template HTML and remove it from the document
  var previewNode = document.querySelector("#template");
  var previewTemplate = previewNode.outerHTML;
  previewTemplate.id = ""
  previewNode.parentNode.removeChild(previewNode);

  var myDropzone = new Dropzone('footer', {
    url: "https://" + s3Bucket,
    // Set the url
    //paramName: "file", // The name that will be used to transfer the file
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
    accept: dropzoneAccept
  });

  myDropzone.on("sending", function (file, xhr, formData) {
    console.log("dropzone sending")
    $.each(file.postData, function (k, v) {
      formData.append(k, v)
    })
    formData.append('Content-type', '')
    formData.append('Content-length', '')
    formData.append('acl', 'public-read')
    //formData.append('eventId', eventId);
  });

  myDropzone.on("complete", function (file) {
    $(file.previewTemplate).removeClass('uploading')

    $.post("/addSessionResource", {
      eventId: eventId,
      name: file.name,
      s3Key: file.s3
    },
      function (result) {
        if (result.result === "begin") {
          session.signal({
            type: "beginSession",
            proposedStartTimeMillis: result.proposedStartTimeMillis
          })
        }
      },
      "json")
  })

  function dropzoneAccept(file, done) {
    file.postData = []
    $.ajax({
      url: '/sign-s3',
      data: {
        name: file.name,
        type: file.type,
        size: file.size
      },
      success: function (response) {
        response = JSON.parse(response)
        file.custom_status = 'ready'
        file.postData = response
        file.s3 = response.key
        $(file.previewTemplate).addClass('uploading')
        done()
      },
      error: function (response) {
        file.custom_status = 'rejected'
        if (response.responseText) {
          response = JSON.parse(response.responseText)
        }
        if (response.message) {
          done(response.message)
          return
        }
        done('error preparing the upload')
      }
    })
  }

  //nanobar
  nanobar = new Nanobar({
    id: "event-progress-nanobar",
    className: "nanobar"
  });

  nanobar.go(0)
})

function triggerSessionStart() {
  $.post("/beginSession",
    {
      eventId: eventId
    },
    function (result) {
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
