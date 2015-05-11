/// <reference path="../typings/node/node.d.ts"/>
// Use AV.Cloud.define to define as many cloud functions as you want.

AV.Cloud.define('countNonEmpty', function(request, response) {
  var query = new AV.Query('Event');
  query.notEqualTo('label', null);
  query.find({
    success: function(results) {
        response.success(results.length);
    },
    error: function() {
        response.error('Event lookup failed');  
    }
  });
});


AV.Cloud.define('getLabelEvents', function(request, response) {
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
  
  var results = new Array();
  var innerQuery = new AV.Query('Label');
  innerQuery.equalTo('tag', request.params.label);
  var query = new AV.Query('Event');
  query.matchesQuery('label', innerQuery);
  query.find({
    success: function(events) {
      events.forEach(function (event) {
        var eventResult = new LabelEvent(request.params.label, event.createdAt, event.updatedAt);
        AV.Query.doCloudQuery('select * from UserMic where event=pointer("Event", "'+event.id+'")', {
          success: function(result) {
            var micList = new Array();
            result.results.forEach(function (userMic) {
              var micListElem = new Object();
              micListElem.timestamp = userMic.get('timestamp');
              micListElem.id = userMic.id;
              micList.push(micListElem);
            });
            eventResult.addMicList(micList);
          },
          error: function(error) {
            response.error('getLabelEvents error when query userMic');
            console.log(error);
          }, 
        });
        results.push(eventResult);
      });
      console.log(results);
      response.success(results);
    },
    error: function(error) {
      response.error('getLabelEvents error when query event');
      console.log(error);
    }
  });
});