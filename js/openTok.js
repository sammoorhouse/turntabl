//log at DEBUG
//  OT.setLogLevel(OT.DEBUG);

var session = TB.initSession(openTokSessionId);
var publisher = TB.initPublisher(openTokApiKey, 'publisher');

// Receive a message and append it to the history
var msgHistory = document.querySelector('#history');
var msgTxt = document.querySelector('#msgTxt');
var form = document.querySelector('form#text-chat');

// Send a signal once the user enters data in the form
form.addEventListener('submit', function(event) {
  event.preventDefault();

  session.signal({
    type: 'msg',
    data: msgTxt.value
  }, function(error) {
    if (!error) {
      msgTxt.value = '';
    }
  });
});

// Attach event handlers
session.on({
  sessionConnected: function(event) {
    console.log("session connected")
    session.publish(publisher);
  },
  streamCreated: function(event) {
    console.log("stream created")
    var subContainer = document.createElement('div');
    subContainer.id = 'stream-' + event.stream.streamId;
    document.getElementById('subscribers').appendChild(subContainer);
    session.subscribe(event.stream, subContainer);
  },
  signal: function(event) {
    console.log("signal")
    var msg = document.createElement('p');
    msg.innerHTML = event.data;
    msg.className = event.from.connectionId === session.connection.connectionId ? 'mine' : 'theirs';
    msgHistory.appendChild(msg);
    msg.scrollIntoView();
  }
});

// Connect to the Session using the 'apiKey' of the application and a 'token' for permission
session.connect(openTokApiKey, openTokToken);
