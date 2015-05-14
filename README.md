### fetchLabelEvent [POST]

You can fetch events info of specify label. It takes a JSON 
object containing a label.

+ label (string) - The label

+ Request (appliction/json)

        {
            "label": "working"
        }

+ Response 201 (application/json)

        {
            "result": [
            {
                "label":"shopping",
                "createdAt":"2015-05-10T06:49:46.913Z",
                "updatedAt":"2015-05-10T06:49:46.913Z",
                "sensorList": [
                    { "timestamp": 1431240614635,"motion":"walking" },
                    ...
                 ],

                "micList": [
                    { "timestamp":1431240777850},"timestamp":1431240614580 },
                    ...
                ],

                "locationList":[
                    { "timestamp":1431240605014,
                      "location":
                        { "type":"GeoPoint",
                          "latitude":39.978198,
                          "longitude":116.442616 }
                    },
                    ...
                ],

                "senzList": [
                    { "sound":  {},
                      "motion": {},
                      "location": {}
                    },
                    ...
                ]
        }
