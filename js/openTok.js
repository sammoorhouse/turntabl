//log at DEBUG
  OT.setLogLevel(OT.DEBUG);

var session = TB.initSession(sessionId);
var publisher = TB.initPublisher(apiKey, 'publisher');

// Attach event handlers
session.on({
  sessionConnected: function(event) {
    session.publish(publisher);
  },
  streamCreated: function(event) {
    var subContainer = document.createElement('div');
    subContainer.id = 'stream-' + event.stream.streamId;
    document.getElementById('subscribers').appendChild(subContainer);
    session.subscribe(event.stream, subContainer);
  },
  signal: function(event){
    console.log("Signal sent from connection " + event.from.id);
  }

});

// Connect to the Session using the 'apiKey' of the application and a 'token' for permission
session.connect(apiKey, token);
