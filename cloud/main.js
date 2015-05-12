/// <reference path="../typings/node/node.d.ts"/>
// Use AV.Cloud.define to define as many cloud functions as you want.

AV.Cloud.define('countNonEmpty', function (request, response) {
  var query = new AV.Query('Event');
  query.notEqualTo('label', null);
  query.find({
    success: function (results) {
      response.success(results.length);
    },
    error: function () {
      response.error('Event lookup failed');
    }
  });
});


AV.Cloud.define('getLabelEvents', function (request, response) {
  //var myRequest = require('request');
  // LabelEvent Object definition
  function LabelEvent(label, createdAt, updatedAt) {
    this.label = label;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.sensorList = undefined;
    this.micList = undefined;
    this.poiList = undefined;
    this.addSensorList = function (sensorList) {
      this.sensorList = sensorList;
    }
    this.addMicList = function (micList) {
      this.micList = micList;
    }
    this.addPoiList = function (poiList) {
      this.poiList = poiList;
    }
  }
  
  // start process log
  var labelEvents = new Array(); // for API return
  
  // find specify tag
  var labelQuery = new AV.Query('Label');
  labelQuery.equalTo('tag', request.params.label);
  // find Event which point to Label
  var eventQuery = new AV.Query('Event');
  eventQuery.matchesQuery('label', labelQuery);
  eventQuery.find().then(function (events) {
    console.log('In eventQuery then');
    var promises = [];
    events.forEach(function (event) {
      console.log('In forEach');
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
        console.log("In when's then");
        function getTimestampArray(arr) {
          var outArr = [];
          arr.forEach(function (elem) {
            outArr.push(elem.get('timestamp'));
          });
          return outArr;
        }
        
        labelEvent.addMicList(getTimestampArray(micList));
        labelEvent.addSensorList(getTimestampArray(sensorList));
        labelEvent.addPoiList(getTimestampArray(locationList));
        labelEvents.push(labelEvent);
        return AV.Promise.as('Done');
      }));
      
      //promises.push(micQuery.find().then(function (result) {
      //  var micList = new Array();
      //  result.forEach(function (elem) {
      //    micList.push(elem.get('timestamp'));
      //  });
      //  labelEvent.addMicList(micList);
      //  return AV.Promise.as('Done');
      //}));
      
    });
    console.log('before return');
    return AV.Promise.when(promises);
  }, function (error) {
      response.error('getLabelEvents error when query Event');
      console.error(error);
    }).then(function (result) {
    console.log('** labelEvents: **')
    console.log(labelEvents.length);
    response.success(labelEvents);
  });
});


AV.Cloud.define('promiseTest', function (request, response) {
  var eventQuery = new AV.Query('Event');

  function doQuery(label) {
    var labelQuery = new AV.Query('Label');
    labelQuery.equalTo('tag', label);
    eventQuery.matchesQuery('label', labelQuery);
    console.log('find label=' + label);
    return eventQuery.find();
  }

  AV.Promise.all([
    doQuery('shopping'),
    doQuery('dining_out')
  ]).then(function (result1) {
    console.log(result1);
    console.log('---------------');
  });
});


AV.Cloud.define('tryAPI', function (request, response) {
  var myRequest = require('request');
  var postData = {
    "filter": 120000,
    "timelines": {
      "location": [{ "timestamp": 1431329016771 }, { "timestamp": 1431331962757 }],
      "motion": [{ "timestamp": 1431329016771 }, { "timestamp": 1431329870846 }],
      "sound": [{ "timestamp": 1431331962757 }, { "timestamp": 1431323000593 }],
    },
    "primary_key": "location",
  };
  myRequest.post({ url: 'http://120.27.30.239:9123/', json: postData }, function (err, httpResponse, body) {
    if (err) {
      return console.error('upload failed:', err);
    }
    console.log('The content of result is:\n' + JSON.stringify(body, null, 4));
    var result = new Object({ 'result': body['result'] });
    console.log(result);
    console.log('Upload successful!  Server responded with:', body['result']);
  });
});