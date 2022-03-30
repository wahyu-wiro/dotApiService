'use strict';

require('dotenv').config();
var utils = require('../utils/writer.js');
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


