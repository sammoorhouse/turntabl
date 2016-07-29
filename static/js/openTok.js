//log at DEBUG
//  OT.setLogLevel(OT.DEBUG);

var session = OT.initSession(openTokSessionId);
var publisher = OT.initPublisher(openTokApiKey, 'publisher', {
  width: 150,
  height: 150
});

// Receive a message and append it to the history
var msgHistory = document.querySelector('#history');
var msgTxt = document.querySelector('#msgTxt');
var button = document.querySelector('#btn-chat');

// Attach event handlers
session.on({
  sessionConnected: function(event) {
    console.log("session connected")
    session.publish(publisher);

    // Send a signal once the user enters data in the form
    button.addEventListener('click', function(event) {
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
    var msgTemplate = $('#chat-message-template')
    msgTemplate.addClass(event.from.connectionId === session.connection.connectionId ? 'right' : 'left')
    msgTemplate.find('#chat-message-image').attr('src', "https://placeholdit.imgix.net/~text?txtsize=13&bg=fa6f57&txtclr=fff%26text%3Dme&txt=ME&w=50&h=50")
    msgTemplate.find('#chat-body-text').text(event.data)
    msgHistory.append(msgTemplate)
    msgTemplate.scrollIntoView();

    /*<li class="right clearfix"><span class="chat-img pull-right">
                  <img src="http://placehold.it/50/FA6F57/fff&text=ME" alt="User Avatar" class="img-circle" />
              </span>
      <div class="chat-body clearfix">
        <div class="header">
          <small class=" text-muted"><span class="glyphicon glyphicon-time"></span>13 mins ago</small>
          <strong class="pull-right primary-font">Bhaumik Patel</strong>
        </div>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur bibendum ornare dolor, quis ullamcorper ligula sodales.
        </p>
      </div>
    </li>*/




    /*
        var msg = document.createElement('p');
        msg.innerHTML = event.data;
        msg.className = event.from.connectionId === session.connection.connectionId ? 'mine' : 'theirs';
        msgHistory.appendChild(msg);
        msg.scrollIntoView();*/
  },
  connectionCreated: function(event) {
    if ((event.connection.connectionId != session.connection.connectionId) && (isLeader)) {
      console.log('Another client connected, start the session');
      triggerSessionStart()
    }
  },
});

session.on("signal:beginSession", function(event) {
  var sessionStartTimeMillis = event.proposedStartTimeMillis
  sessionEndTimeMillis = sessionStartTimeMillis + sessionDurationMillis
})

// Connect to the Session using the 'apiKey' of the application and a 'token' for permission
session.connect(openTokApiKey, openTokToken);
