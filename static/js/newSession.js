$(function () {

  $("sessionDate").value = Date();

  var text_max = 50;
  $('#count_message').html('(' + text_max + ')');

  $('#sessionName').keyup(function () {
    var text_length = $('#sessionName').val().length;
    var text_remaining = Math.max(0, text_max - text_length);

    $('#count_message').html('(' + text_remaining + ')');
  });

  var GET = {};
  var query = window.location.search.substring(1).split("&");
  for (var i = 0, max = query.length; i < max; i++) {
    if (query[i] === "") // check for trailing & with no param
      continue;
    var param = query[i].split("=");
    GET[decodeURIComponent(param[0])] = decodeURIComponent(param[1] || "");
  }


  var modal = $('#myModal')
  $("#myModal").click((evt) => {
    if (evt.target == modal[0]) {
      modal.toggleClass("enabled", false)
    }
  });
  $("#btn-close").click(() => {
    modal.toggleClass("enabled", false)
  });
  $("#new-session-link").click(() => {
    modal.toggleClass("enabled", true)
  });

  if (GET["modal"] == "1") {
    modal.toggleClass("enabled", true)
  } else {
    modal.toggleClass("enabled", false)
  }
})