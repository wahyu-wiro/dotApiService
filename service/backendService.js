const request = require('request');

exports.uploadFile = function(data){
    console.log(process.env.BACKEND_SERVICE_HOST + '/uploadFileFormData');
    return new Promise(async function(resolve){
        var options = {
            'method': 'POST',
            'url': process.env.BACKEND_SERVICE_HOST + '/uploadFileFormData',
            'headers': {
                'apiService': process.env.SERVICE_CODE,
            },
            'formData': data
        };
        // console.log("options::", options);
        request(options, function (error, response) {
            if (error){
                console.log("error::", error);
                return resolve(false);    
            }
            try {
                resolve(JSON.parse(response.body))
            } catch (error) {
                resolve(response.body)
            }
        });
    })
}
exports.getRegency = function(data){
    console.log('getRegency data=>',data)
    return new Promise(async function(resolve){
        var options = {
            'method': 'GET',
            'url': process.env.BACKEND_SERVICE_HOST + '/master/regencies',
            'headers': {
                'signature': process.env.SIGNATURE,
                'param': data.param
            }
        };
        // console.log("options::", options);
        request(options, function (error, response) {
            if (error){
                console.log("error::", error);
                return resolve(false);    
            }
            try {
                resolve(JSON.parse(response.body))
            } catch (error) {
                resolve(response.body)
            }
        });
    })
}
exports.geoCode = async function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            if (!data.latlng) {
                message = {
                    "responseCode": process.env.NOTACCEPT_RESPONSE,
                    "responseMessage": "latlng required"
                }
                return resolve(message);
            }
            var p = JSON.stringify({'latlng': data.latlng })
            var options = {
                'method': 'GET',
                'url': process.env.THIRDPARTY_HOST + '/google/maps',
                'headers': {
                    'param': p,
                    'signature': 'dWx0aXBhZ2VNZXJjaGFudFdlYjpkV3gwYVhCaFoyVk5aWEpqYUdGdWRGZGxZanAxYkhReGNEUm5NMDB6Y21Ob05HNTBWek5p'
                }
            };
            console.log("options =>", options);
            request(options, function (error, response) {
                if (error){
                    console.log("error::", error);
                    return resolve(false);    
                }
                try {
                    resolve(JSON.parse(response.body))
                } catch (error) {
                    resolve(response.body)
                }
            });            

        } catch (e) {
            console.log('Error geoCode => ', e)
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}