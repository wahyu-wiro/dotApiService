const request = require('request');
const crypto = require('crypto');
const efs = require("fs");
// const configV1 = JSON.parse(efs.readFileSync("./configV1.json", "utf-8"));
// const configV1 = require('../configV1');
const asym = require('../config/asymmetric');

class Validator {
    constructor(signature, token, authorization, appId) {
        // console.log("new validator a =>", {
        //     'signature =>': signature,
        //     'token =>': token
        // });
        if (signature) {
            this.signature = signature;
        }
        if (token) {
            this.token = token;
        }
        if (appId) {
            this.appId = false;
        }
        if (authorization) {
            this.authorization = authorization;
        }
        // console.log("new validator b =>", {
        //     'this.signature =>': this.signature,
        //     'this.token =>': this.token
        // });
    }
    async checkToken() {
        // console.log("This is token validator " + this.token);
        const url = process.env.AUTH_SERVICE_HOST + "/identifier?v=1&flowEntry=ultipage";
        // console.log("url:", url);
        const options = {
            'method': 'GET',
            'url': url,
            'headers': {
                'token': this.token,
                'signature': this.signature,
                'Authorization': this.authorization,
            }
        }
        let result = await sentRequest(options);
        if (result.responseCode == process.env.SUCCESS_RESPONSE) {
            return true;
        } else {
            return false;
        }
    }
    async checkSignature() {
        let svUrl = process.env.AUTH_SERVICE_HOST + "/signatureValidation";
        const options = {
            "headers": {
                "signature": this.signature
            },
            "method": "POST",
            "url": svUrl
        }
        let result = await sentRequest(options);
        if (result.responseCode == process.env.SUCCESS_RESPONSE) {
            this.appId = result.data.appId;
            // console.log("this.appId::", this.appId);
            return true;
        } else {
            return false;
        }
    }
    async getData() {
        const algorithm = 'aes256';
        const secretKey = process.env.AES_KEY_SERVER;
        const iv = process.env.AES_IV_SERVER;
        let decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
        let decrypted = decipher.update(this.token, 'base64', 'utf8');
        let data = JSON.parse(decrypted + decipher.final('utf8'));
        var options = {
            'method': 'GET',
            'url': process.env.AUTH_SERVICE_HOST + '/users/' + data.customerId,
            'headers': {}
        };
        return await sentRequest(options);
    }
    async decryptObjectData(data = {}) {
        let keys = Object.keys(data);
        for (let key of keys) {
            //   data[key] = asim.decryptAes(data[key]);
            let ex = ['photo', 'cardImage']
            // console.log(key, "::", data[key].substring(0, 10));
            if (!ex.includes(key)) {
                data[key] = await asym.decrypterRsa(data[key]);
            }
            // console.log(key, "::", data[key].substring(0, 10));
            if (data[key] === false) {
                return false;
            }
        }
        // console.log("data::", data);
        return data
    }
}

module.exports = Validator;

function sentRequest(options) {
    return new Promise(async function (resolve, reject) {
        request(options, (error, response, body) => {
            if (error) {
                console.log("error::", error);
                resolve(false);
            } else {
                try {
                    var b = body.toLowerCase();
                    b = b.substr(0,17)
                    if(b == 'too many requests') {
                      resolve({
                        "responseCode": '429',
                        "responseMessage": body
                      })
                    }else{
                        let result = JSON.parse(body);
                        resolve(result);    
                    }          
                } catch (error) {
                    console.log("error::", error);
                    resolve(false);
                }
            }
        });
    })
}