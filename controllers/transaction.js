'use strict';

var utils = require('../utils/writer.js');
var apiService = require('../service/apiService');
const pgCon = require('../config/pgConfig');
var isValid = '';
const asym = require('../config/asymmetric');
// var arrStatus = ['Pending', 'Assign', 'Pick up', 'On Delivery', 'Delivered'];
var arrStatus = ['Pending', 'Assigned', 'Pickup', 'Delivering', 'Delivered', 'Cancelled'];
var arrService = ['sameDay', 'priority'];
// const validator = require('../class/validator');
const check = require('../controllers/check');
const validator = require('../class/validator');
const accountService = require('../service/accountService');
const transactionService = require('../service/transactionService');
const checking = require('../controllers/check');
const kredential = process.env.KREDENTIAL_KEY;
const Cryptr = require('cryptr');
const cryptr = new Cryptr(kredential)

const driverDivisionId = '9'; //division id driver from postgreq
const asymmetric = require("../config/asymmetric");
var log={}

module.exports.transactionRequest = async function transactionRequest(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
    let body = req.swagger.params['body'].value;
    token = asymmetric.decryptAes(token);
    if (token == false) {
        utils.writeJson(res, {
            responseCode: process.env.NOTACCEPT_RESPONSE,
            responseMessage: "Unable to read token",
        });
        return;
    }
    signature = asymmetric.decryptAes(signature);
    if (signature == false) {
        utils.writeJson(res, {
            responseCode: process.env.NOTACCEPT_RESPONSE,
            responseMessage: "Unable to read signature",
        });
        return;
    }
    // check token 
    isValid = new validator(signature);
    let ct = await check.identifier(token);
    if (await isValid.checkSignature()) {
        if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
            body.profile = ct.data;
            log.accAddress = req.headers.userIp + '_' + req.headers['user-agent'];
            log.link = req.url;
            log.method = req.method;
            body.log = log
            let response = await transactionService.transactionRequest(body);
            console.log('response =>',response)
            if (ct.data.newToken) {
                response.token = ct.data.newToken
            }
            utils.writeJson(res, response);
        } else {
            utils.writeJson(res, ct);
        }
    } else {
        utils.writeJson(res, {
            responseCode: process.env.UNAUTHORIZED_RESPONSE,
            responseMessage: "Unauthorize"
        })
    }
}

module.exports.notificationPayment = async function notificationPayment(req, res) {
    // check token
    let body = req.swagger.params['body'].value;
    let response = await transactionService.notificationPayment(body);
    if (ct.data.newToken) {
        response.token = ct.data.newToken
    }
    utils.writeJson(res, response);
}

module.exports.updatePayment = async function updatePayment(req, res) {
    console.log('updatePayment =>')
    var token = req.swagger.params['token'].value;
    token = asymmetric.decryptAes(token);
    if (token == false) {
        utils.writeJson(res, {
            responseCode: process.env.NOTACCEPT_RESPONSE,
            responseMessage: "Unable to read token",
        });
        return;
    }

    var signature = req.swagger.params['signature'].value;
    signature = asymmetric.decryptAes(signature);
    if (signature == false) {
        utils.writeJson(res, {
            responseCode: process.env.NOTACCEPT_RESPONSE,
            responseMessage: "Unable to read signature",
        });
        return;
    }    
    var id = req.swagger.params['id'].value;
    let aesParam = await asymmetric.decrypterRsa(
        req.swagger.params["aes"].value
    );

    if (aesParam == false) {
        utils.writeJson(res, {
            responseCode: process.env.NOTACCEPT_RESPONSE,
            responseMessage: "Unable to read aes",
        });
        return;
    }
    let aesKey = aesParam.split(":")[0];
    let aesIv = aesParam.split(":")[1];

    let clientKey = req.swagger.params["clientKey"].value;
    clientKey = asymmetric.decryptAes(clientKey);
    if (clientKey == false) {
        utils.writeJson(res, {
            responseCode: process.env.NOTACCEPT_RESPONSE,
            responseMessage: "Unable to read clientKey",
        });
        return;
    }    
    let body = {};
    // check token 
    isValid = new validator(signature);
    let ct = await check.identifier(token);
    if (await isValid.checkSignature()) {
        if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
            body.profile = ct.data;
            if (id) {
                body.id = id;
            }
            log.accAddress = req.headers.userIp + '_' + req.headers['user-agent'];
            log.link = req.url;
            log.method = req.method;
            body.log = log
            let response = await transactionService.updatePayment(body);
            // if(response.data){
            //     var result = await asymmetric.encrypterRsa(
            //         JSON.stringify(response.data),
            //         clientKey
            //     );
            //     result = asymmetric.encryptAes(result, aesKey, aesIv);
            //     response.data=result;
            // }
            if (ct.data.newToken) {
                response.token = ct.data.newToken
            }
            utils.writeJson(res, response);
        } else {
            utils.writeJson(res, ct);
        }
    } else {
        utils.writeJson(res, {
            responseCode: process.env.UNAUTHORIZED_RESPONSE,
            responseMessage: "Unauthorize"
        })
    }
}
module.exports.gopayTransactionRequest = async function gopayTransactionRequest(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
    let body = req.swagger.params['body'].value;
    token = asymmetric.decryptAes(token);
    if (token == false) {
        utils.writeJson(res, {
            responseCode: process.env.NOTACCEPT_RESPONSE,
            responseMessage: "Unable to read token",
        });
        return;
    }
    signature = asymmetric.decryptAes(signature);
    if (signature == false) {
        utils.writeJson(res, {
            responseCode: process.env.NOTACCEPT_RESPONSE,
            responseMessage: "Unable to read signature",
        });
        return;
    }
    // check token 
    isValid = new validator(signature);
    let ct = await check.identifier(token);
    if (await isValid.checkSignature()) {
        if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
            body.profile = ct.data;
            log.accAddress = req.headers.userIp + '_' + req.headers['user-agent'];
            log.link = req.url;
            log.method = req.method;
            body.log = log
            let response = await transactionService.gopayTransactionRequest(body);
            console.log('response =>',response)
            if (ct.data.newToken) {
                response.token = ct.data.newToken
            }
            utils.writeJson(res, response);
        } else {
            utils.writeJson(res, ct);
        }
    } else {
        utils.writeJson(res, {
            responseCode: process.env.UNAUTHORIZED_RESPONSE,
            responseMessage: "Unauthorize"
        })
    }
}