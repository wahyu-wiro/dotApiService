require('dotenv').config();
const request = require('request');
exports.addLog = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            var a = {
                "accessor": data.accessor,
                "accessorAddress": data.accessorAddress,
                "accessorCategory": data.accessorCategory,
                "link": data.link,
                "method": data.method,
                "status": data.status,
                "moduleName": data.moduleName,
                "information": data.information,
                "activities": data.activities
            }
            if (data.transactionCode) {
                a.transactionCode = data.transactionCode;
            }

            if (data.category) {
                a.category = data.category;
            }
            request.post({
                "headers": {
                    "content-type": "application/json",
                    "signature": process.env.SIGNATURE
                },
                "url": process.env.LOG_SERVICE_HOST + "/log",
                "body": a,
                json: true
            }, async function (error, response, body) {
                if (error) {
                    console.log('Error Briding add log => ', error)
                    let m = {
                        responseCode: process.env.ERRORINTERNAL,
                        responseMessage: 'Internal server error, please try again!'
                    }
                    resolve(m);
                } else {
                    resolve(body);
                }
            })
        } catch (e) {
            console.log('Error bridging to log service ', e)
            let m = {
                responseCode: process.env.ERRORINTERNAL,
                responseMessage: 'Internal server error, please try again!'
            }
            resolve(m);
        }
    })
}