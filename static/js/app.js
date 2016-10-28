var intervalMillis = 15 * 1000 //15 seconds
var timerToken = 0
var sessionEndTimeMillis
var nanobar

$(function () { //on load


  $(".dropdown-toggle").dropdown();
 $('.dropdown-menu > li').click(function() {
    var toggle = $(this).parent().siblings('.dropdown-toggle');
    $(toggle).html($(this).text() + "<span class=\"caret\"></span>");
    $(toggle).css("color", "#000");
})

  
var text_max = 50;
$('#count_message').html(text_max + " / " + text_max);

$('#sessionName').keyup(function() {
  var text_length = $('#sessionName').val().length;
  var text_remaining = text_max - text_length;
  
  $('#count_message').html(text_remaining + " / " + text_max);
});




var GET = {};
var query = window.location.search.substring(1).split("&");
for (var i = 0, max = query.length; i < max; i++)
{
    if (query[i] === "") // check for trailing & with no param
        continue;
    var param = query[i].split("=");
    GET[decodeURIComponent(param[0])] = decodeURIComponent(param[1] || "");
}


//modal
// Get the modal
var modal = document.getElementById('myModal');

// Get the button that opens the modal
var btn = document.getElementById("myBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

if (GET["modal"] == "1"){
// When the user clicks on the button, open the modal 
//btn.onclick = function() {
    modal.style.display = "block";
//}
} else {modal.style.display = "none";}

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
