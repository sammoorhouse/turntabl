//log at DEBUG
//  OT.setLogLevel(OT.DEBUG);

var publisherOptions = {
  width: '100%',
  height: '100%'
};

var subscriberOptions = {
  width: '100%',
  height: '100%'
};

session.on({
  sessionConnected: function (event) {
    console.log("session connected")

    publisher = OT.initPublisher('publisher');
    session.publish(publisher, publisherOptions);
  },
  streamCreated: function (event) {
    console.log("stream created")

    session.subscribe(event.stream, document.getElementById('subscribers'), subscriberOptions);

    if (isLeader) {
      $.post("/beginSession", {
          eventId: eventId
        },
        function (result) {
          //uh
        })
    }
  }
});

$(function () {
  var session = OT.initSession(openTokSessionId);
  session.connect(openTokApiKey, openTokToken);
})