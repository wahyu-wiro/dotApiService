'use strict';

require('dotenv').config();
var utils = require('../utils/writer.js');
var apiService = require('../service/apiService');
const pgCon = require('../config/pgConfig');
const request = require('request');
let isValid = '';
const asym = require('../config/asymmetric');
// var arrStatus = ['Pending', 'Assign', 'Pick up', 'On Delivery', 'Delivered'];
var arrStatus = ['Pending', 'Assigned', 'Pickup', 'Delivering', 'Delivered', 'Cancelled'];
var arrService = ['sameDay', 'priority'];
const validator = require('../class/validator');
const accountService = require('../service/accountService');
const authService = require('../service/authService');
const backendService = require('../service/backendService');
const checking = require('../controllers/check');
const kredential = process.env.KREDENTIAL_KEY;
const Cryptr = require('cryptr');
const cryptr = new Cryptr(kredential)
const check = require('../controllers/check');
const driverDivisionId = '9'; //division id driver from postgreq
const asymmetric = require("../config/asymmetric");
var log={}

module.exports.loginAccount = async function loginAccount(req, res) {
    var cont = req.swagger.params['continue'].value;
    var flowEntry = req.swagger.params['flowEntry'].value;
    var appSignature = req.swagger.params['appSignature'].value;
    var body = req.swagger.params['body'].value;
    var credential = {};

    credential.continue = cont;
    credential.flowEntry = flowEntry;
    credential.appSignature = appSignature;
    body.continue = cont;
    body.flowEntry = flowEntry;
    body.appSignature = appSignature;
    var log={}
    log.accAddress = req.headers.userIp + '_' + req.headers['user-agent'];
    log.link = req.url;
    log.method = req.method;
    body.log = log
    console.log('body 2 =>',body)

    // let sign = [appId,deviceId].join['|']
    // body.signature = cryptr.encrypt(sign);

    let response = await authService.loginAccount(body);
    console.log('RESPONSE LOGIN ACCOUNT ===> ', response)
    utils.writeJson(res, response);
}

module.exports.getAccount = async function getAccount(req, res) {
    var appSignature = req.swagger.params['appSignature'].value;
    var param = req.swagger.params['param'].value;
    var body = {};
    body.appSignature = appSignature;
    body.param = JSON.parse(param);
    console.log('body=>',body)
    let response = await authService.getAccount(body);
    console.log('RESPONSE LOGIN ACCOUNT ===> ', response)
    utils.writeJson(res, response);
}
module.exports.logoutAccount = async function logoutAccount(req, res) {
    var token = req.swagger.params['token'].value;
    let body = {};
    body.token = token;

    // let response = await authService.logoutAccount(body);
    let response = {
        "responseCode": process.env.SUCCESS_RESPONSE,
        "responseMessage": "Success"
    }
    console.log('RESPONSE LOGOUT ACCOUNT ===> ', response)
    utils.writeJson(res, response);
}

module.exports.registerAccount = async function registerAccount(req, res) {
    var appId = req.swagger.params['appId'].value;
    var body = req.swagger.params['body'].value;
    body.appId = appId;

    let response = await authService.registerAccount(body);    
    console.log('RESPONSE REGISTER ACCOUNT ===> ', response)

    utils.writeJson(res, response);
}

async function decrypt(data) {
    try {
        let pba = process.env.KREDENTIAL_KEY;
        var cryptr = new Cryptr(pba);
        var decoded = cryptr.decrypt(data);
        console.log('decoded =>', decoded)
        var arr_decoded = decoded.split("|");
        return arr_decoded;
    } catch (err) {
        console.log("decrypt err =>", err);
        return process.env.ERRORINTERNAL_RESPONSE;
    }
}

module.exports.otpConfirmation = async function otpConfirmation(req, res) {
    var body = req.swagger.params['body'].value;
    // let apiService = req.swagger.params['apiService'].value;
    let appId = req.swagger.params['appId'].value;
    let appSignature = req.swagger.params['appSignature'].value;
    let deviceId = req.swagger.params['deviceId'].value;
    appId = asymmetric.decryptAes(appId);
    if (appId == false) {
        utils.writeJson(res, {
            responseCode: process.env.NOTACCEPT_RESPONSE,
            responseMessage: "Unable to read appId",
        });
        return;
    }

    appSignature = asymmetric.decryptAes(appSignature);
    if (appSignature == false) {
        utils.writeJson(res, {
            responseCode: process.env.NOTACCEPT_RESPONSE,
            responseMessage: "Unable to read appSignature",
        });
        return;
    }

    deviceId = asymmetric.decryptAes(deviceId);
    if (deviceId == false) {
        utils.writeJson(res, {
            responseCode: process.env.NOTACCEPT_RESPONSE,
            responseMessage: "Unable to read deviceId",
        });
        return;
    }
    var result = false;
    let keys = Object.keys(body);
    for (let key of keys) {
      body[key] = await asymmetric.decryptAes(body[key]);
      body[key] = await asymmetric.decrypterRsa(body[key]);
      if (!body[key]) {
        console.log(key + ": " + body[key]);
        result = {
          responseCode: process.env.NOTACCEPT_RESPONSE,
          responseMessage: "Unable to read " + key,
        };
        break;
      }
    }
    if (result) {
      utils.writeJson(res, result);
      return;
    }
    // console.log('body =>',body)
    if(body.urlName=='null') {body.urlName=''}
    if(body.cityId=='null') {body.cityId=''}
    if(body.filter=='null') {body.filter=''}

    body.signature = [appId, deviceId].join('|');
    body.signature = cryptr.encrypt(body.signature);

    body.appId = appId;
    body.deviceId = deviceId;
    body.appSignature = appSignature;
    // body.apiService = apiService;
    // console.log('otpConfirmation body => ', body)
    isValid = new validator(body.signature);
    console.log('1 ==> ', isValid)
    if (await isValid.checkSignature()) {
        log.accAddress = req.headers.userIp + '_' + req.headers['user-agent'];
        log.link = req.url;
        log.method = req.method;
        body.log = log
        let response = await authService.otpConfirmation(body);
        if(response.responseCode == process.env.SUCCESS_RESPONSE) { // updatedeviceId
            if(body.filter == 'login') {
                body.merchantId = response.data.merchantId;
                var udi = await authService.updateDeviceId(body)
                console.log('updateDeviceId =>',udi)
            }
        }
        console.log('otpConfirmation =>',response)
        utils.writeJson(res, response);
    } else {
        utils.writeJson(res, {
            responseCode: process.env.UNAUTHORIZED_RESPONSE,
            responseMessage: "Unauthorize"
        })
    }
}
module.exports.otpUpdate = async function otpUpdate(req, res) {
    var body = req.swagger.params['body'].value;
    console.log('otpUpdate body 1 => ', body)
    // let apiService = req.swagger.params['apiService'].value;
    let appId = req.swagger.params['appId'].value;
    let appSignature = req.swagger.params['appSignature'].value;
    let deviceId = req.swagger.params['deviceId'].value;
    appId = asymmetric.decryptAes(appId);
    if (appId == false) {
        utils.writeJson(res, {
            responseCode: process.env.NOTACCEPT_RESPONSE,
            responseMessage: "Unable to read appId",
        });
        return;
    }
    appSignature = asymmetric.decryptAes(appSignature);
    if (appSignature == false) {
        utils.writeJson(res, {
            responseCode: process.env.NOTACCEPT_RESPONSE,
            responseMessage: "Unable to read appSignature",
        });
        return;
    }
    deviceId = asymmetric.decryptAes(deviceId);
    if (deviceId == false) {
        utils.writeJson(res, {
            responseCode: process.env.NOTACCEPT_RESPONSE,
            responseMessage: "Unable to read deviceId",
        });
        return;
    }

    var result = false;
    let keys = Object.keys(body);
    for (let key of keys) {
      body[key] = await asymmetric.decryptAes(body[key]);
      body[key] = await asymmetric.decrypterRsa(body[key]);
      if (!body[key]) {
        console.log(key + ": " + body[key]);
        result = {
          responseCode: process.env.NOTACCEPT_RESPONSE,
          responseMessage: "Unable to read " + key,
        };
        break;
      }
    }
    if (result) {
      utils.writeJson(res, result);
      return;
    }

    body.signature = [appId, deviceId].join('|');
    body.signature = cryptr.encrypt(body.signature);

    body.appId = appId;
    body.deviceId = deviceId;
    body.appSignature = appSignature;
    // body.apiService = apiService;
    console.log('otpUpdate body 2 => ', body)
    isValid = new validator(body.signature);
    console.log('1 ==> ', isValid)
    if (await isValid.checkSignature()) {
        let response = await authService.otpUpdate(body);
        console.log('otpUpdate =>',response)
        utils.writeJson(res, response);
    } else {
        utils.writeJson(res, {
            responseCode: process.env.UNAUTHORIZED_RESPONSE,
            responseMessage: "Unauthorize"
        })
    }
}
