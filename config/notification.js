'use strict';
const request = require('request');

exports.sendErrorNotification = async function(datalog = ""){
    // var receiver = ["ronaldsengkey@usahakreatif.co.id", "safriansah@usahakreatif.co.id", "wahyu@usahakreatif.co.id"];
    let options = {
        'method': 'POST',
        'url': process.env.MESSAGE_BROKER_HOST + '/blast/notification',
        'headers': {
            'signature': process.env.SIGNATURE,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "data_content": JSON.stringify({
                "category": "global",
                "type": "email",
                "service": "ultipageMerchantService",
                "receiver": ["wahyu@usahakreatif.co.id"],
                "title": "Error Notification",
                "text": datalog
            }),
            "data_status": "direct"
        })
      
    };
    let result = await sentRequest(options);
    console.log("sendErrorNotification::", result);
    return result;
}

function sentRequest(options){
    return new Promise(async function(resolve){
        request(options, function (error, response) {
            try {
                if (error) {
                    console.log("error::", error);
                    return resolve(false)
                }
                console.log("sentRequest::", response.body);
                try {
                    return resolve(JSON.parse(response.body));
                } catch (error) {
                    return resolve(response.body);   
                }
            } catch (error) {
                console.log("error::", error);
                return resolve(false);
            } 
        });
    })  
}