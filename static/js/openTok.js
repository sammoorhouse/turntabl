//log at DEBUG
//  OT.setLogLevel(OT.DEBUG);

var session = OT.initSession(openTokSessionId);
var publisherOptions = {
  width: '100%',
  height: '100%'
};


// Attach event handlers
session.on({
  sessionConnected: function(event) {
    console.log("session connected")

    publisher = OT.initPublisher('publisher');
    session.publish(publisher, publisherOptions);
  },
  streamCreated: function(event) {
    console.log("stream created")
    var subContainer = document.createElement('div');
    subContainer.id = 'stream-' + event.stream.streamId;
    document.getElementById('subscribers').appendChild(subContainer);
    //session.subscribe(event.stream, subContainer);
    session.subscribe(event.stream, document.getElementById('subscribers'));
  },
  /*connectionCreated: function(event) {
    if ((event.connection.connectionId != session.connection.connectionId) && (isLeader)) {
      console.log('Another client connected, start the session');
      triggerSessionStart()
    }
  },*/
});

session.on("signal:beginSession", function(event) {
  var sessionStartTimeMillis = event.proposedStartTimeMillis
  sessionEndTimeMillis = sessionStartTimeMillis + sessionDurationMillis
})

$(function(){
/*
  OT.getDevices(function(error, devices) {
    initialiseDeviceList(devices);
  });
  */
  session.connect(openTokApiKey, openTokToken);
})


//--------------


/*function initialiseDeviceList(devices){
  var videoInputDevices = devices.filter(function(element) {
    return element.kind == "videoInput";
  });

  publishers = videoInputDevices.map(function(device, idx){
    var pubOptions = { 
      //videoSource: device.deviceId,
      width: 196,
      height: 100
    };

    console.log("video device: " + device.deviceId);
    
    $( "#camera_input_template" )
      .clone()
      .attr("id", device.deviceId)
      .appendTo( "#camera_input_device_list" );

    var thumbnailId = "device-thumbnail" + device.deviceId
    $("#"+device.deviceId+" .camera_input_template_link").attr("id", device.deviceId);
    $("#"+device.deviceId+" .device-thumbnail").attr("id", thumbnailId);
    $("#"+device.deviceId+" .device-name").text("Camera #" + idx+1)

    //publisher = OT.initPublisher(thumbnailId, pubOptions, function(error) {
    publisher = OT.initPublisher("publisher", pubOptions, function(error) {
      if (error) {
        // The client cannot publish.
        // You may want to notify the user.
      } else {
        console.log('Publisher initialized.');
      }
    });

    return publisher;
  })
}

function selectCamera(element){
  var id = element.id
  selectedPublisherId = id
  highlightSelectedPublisher(selectedPublisherId)
  var publisher = publishers.find(function(publisher){publisher.id == selectedPublisherId})
  session.publish(publisher, function(error) {
    if (error) {
      console.log(error);
    } else {
      console.log('Publishing a stream.');
    }
  });
}


highlightSelectedPublisher = function(id){
  $('camera-selector').toggleClass('active', false);
  $("#"+id).toggleClass('active', true)
}*/