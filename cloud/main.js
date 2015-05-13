/// <reference path="../typings/node/node.d.ts"/>
// Use AV.Cloud.define to define as many cloud functions as you want.

/// requires
var myRequest = require('request');

// LabelEvent Object definition
function LabelEvent(label, createdAt, updatedAt) {
  this.label = label;
  this.createdAt = createdAt;
  this.updatedAt = updatedAt;
  this.sensorList = undefined;
  this.micList = undefined;
  this.locationList = undefined;
  this.senzList = undefined;
  this.addSensorList = function (sensorList) {
    this.sensorList = sensorList;
  };
  this.addMicList = function (micList) {
    this.micList = micList;
  };
  this.addLocationList = function (locationList) {
    this.locationList = locationList;
  };
  this.addSenzList = function (senzList) {
    this.senzList = senzList;
  };
};

/// local functions 
function retrieveAPI(locationList, micList, sensorList) {
  var postData = {
    "filter": 120000,
    "timelines": {
      "location": locationList,
      "sound": micList,
      "motion": sensorList,
    },
    "primary_key": "location",
  };
  //console.log(postData);
  return new AV.Promise(function (reslove, reject) {
    myRequest.post({ url: 'http://120.27.30.239:9123/', json: postData }, function (err, httpResponse, body) {
      if (err) {
        console.error('retriveAPI failed:', err);
        reject([]);
      }
      //console.log('retriveAPI result:', body['result']);
      reslove(body['result']);
    });
  });
};


AV.Cloud.define('fetchLabelEvents', function (request, response) {
  var labelEvents = new Array(); // for API return
  
  // find specify tag
  var labelQuery = new AV.Query('Label');
  labelQuery.equalTo('tag', request.params.label);
  // find Event which point to Label
  var eventQuery = new AV.Query('Event');
  eventQuery.matchesQuery('label', labelQuery);
  eventQuery.find().then(function (events) {
    //console.log('In eventQuery then');
    var promises = [];
    events.forEach(function (event) {
      //console.log('In forEach');
      var labelEvent = new LabelEvent(request.params.label, event.createdAt, event.updatedAt);
      // find UserMic which point to Event
      var micQuery = new AV.Query('UserMic');
      micQuery.equalTo('event', event);
      // find UserSensor which point to Event
      var sensorQuery = new AV.Query('UserSensor');
      sensorQuery.equalTo('event', event);
      // find UserLocation which point to Event
      var locationQuery = new AV.Query('UserLocation');
      locationQuery.equalTo('event', event);
      promises.push(AV.Promise.when(
        micQuery.find(),
        sensorQuery.find(),
        locationQuery.find()
        ).then(function (micList, sensorList, locationList) {
        //console.log("In when's then");
        var micListResult = [];
        micList.forEach(function(userMic) {
          micListResult.push({'timestamp':userMic.get('timestamp'), 'soudTag':userMic.get('soudTag')});
        });
        labelEvent.addMicList(micListResult);
        var sensorListResult = [];
        sensorList.forEach(function(userSensor) {
          sensorListResult.push({'timestamp':userSensor.get('timestamp'), 'motion':userSensor.get('motion')});
        });
        labelEvent.addSensorList(sensorListResult);
        var locationListResult = [];
        locationList.forEach(function (userLocation) {
          locationListResult.push({'timestamp': userLocation.get('timestamp'), 'location':userLocation.get('location')});
        });
        labelEvent.addLocationList(locationListResult);
        labelEvents.push(labelEvent);
        return AV.Promise.as('Done');
      }));
    });
    //console.log('before return');
    return AV.Promise.when(promises);
  }, function (error) {
      response.error('getLabelEvents error when query Event');
      console.error(error);
    }).then(function () {
    // use senz.middleware.log.rawsenz
    var promises = [];
    labelEvents.forEach(function (labelEvent) {
      promises.push(
          retrieveAPI(labelEvent.locationList, labelEvent.micList, labelEvent.sensorList).then(function (senzList) {
            //console.log('addSenzList');
            labelEvent.addSenzList(senzList);
          })
        );
    });
    return AV.Promise.when(promises);
  }).then(function () {
    //console.log('** labelEvents: **');
    //console.log(labelEvents);
    response.success(labelEvents);
  });
});