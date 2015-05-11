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

  var labelEvents = new Array();
  var labelQuery = new AV.Query('Label');
  labelQuery.equalTo('tag', request.params.label);
  var eventQuery = new AV.Query('Event');
  eventQuery.matchesQuery('label', labelQuery);
  eventQuery.find().then(function (events) {
    console.log('In eventQuery then');
    var promises = [];
    events.forEach(function (event) {
      console.log('In _.each');
      var micQuery = new AV.Query('UserMic');
      micQuery.equalTo('event', event);
      promises.push(micQuery.find().then(function (result) {
        var labelEvent = new LabelEvent(request.params.label, event.createdAt, event.updatedAt);
        var micList = new Array();
        result.forEach(function (elem) {
          micList.push(elem.get('timestamp'));
        });
        labelEvent.addMicList(micList);
        labelEvents.push(labelEvent);
        return AV.Promise.as('Done');
      }));
    });
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
  function doubleUp(value) {
    return value * 2;
  }
  function increment(value) {
    return value + 1;
  }
  function output(value) {
    console.log(value);
  }

  var promise = Promise.resolve(1);
  promise
    .then(increment)
    .then(doubleUp)
    .then(output)
    .catch(function (error) {
    console.error(error);
  });
});