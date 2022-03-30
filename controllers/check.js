'use strict';

const request = require('request');
let message = {};

var mongoose = require('mongoose').set('debug', true);
var mongo = require('../config/mongo');
var accountSchema = require('../config/accountSchema');
var otpSchema = require('../config/otpSchema');
var authService = require('../service/authService');
const serviceJson = require('../service.json');

async function findDataAccount(data) {
  try {
    mongoose.Promise = global.Promise;
    await mongoose.connect(mongo.mongoDb.url);
    let tc = await accountSchema.findOne({
      "token": data,
    });
    await mongoose.connection.close();
    if (tc === null) {
      return ({
        responseCode: process.env.NOTFOUND_RESPONSE,
        responseMessage: "Not found account"
      })
    } else {
      return ({
        responseCode: process.env.SUCCESS_RESPONSE,
        responseMessage: "Success",
        data: tc
      })
    }
  } catch (e) {
    console.log('Error find data account ==> ', e);
    return ({
      responseCode: process.env.ERRORINTERNAL_RESPONSE,
      responseMessage: 'Internal server error, please try again!'
    })
  }
}

async function updateLoginAccount(data) {
  try {
    var tc = {};
    var newTok = {};
    tc.newToken = "aaaaaaaaaaaaaaaaaaaaaaaaa";
    var sortLatest = {
      "createdDate": "-1"
    };
    mongoose.Promise = global.Promise;
    await mongoose.connect(mongo.mongoDb.url);
    tc = await accountSchema.findOneAndUpdate({
      "phone": data.phone,
      "phoneCode": data.phoneCode,
      "userType": "ultipage"
    }, {
      $set: {
        "token": data.newToken
      }
    }, {
      new: true,
      sort: sortLatest
    });
    newTok = {
      "newToken" : data.newToken
    }
    await mongoose.connection.close();
    if (tc) {
      let newObj = Object.assign(newTok,tc._doc)
      tc.tokennnnnnnnnnnnnn = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
      return ({
        responseCode: process.env.SUCCESS_RESPONSE,
        responseMessage: "Success",
        data: newObj
      })
    } else {
      return ({
        responseCode: process.env.NOTACCEPT_RESPONSE,
        responseMessage: "Failed"
      })
    }
  } catch (e) {
    console.log('Error update login account ===> ', e);
    return ({
      responseCode: process.env.ERRORINTERNAL_RESPONSE,
      responseMessage: 'Internal server error, please try again!'
    })
  }
}

// exports.checkToken = function (token) {
//   return new Promise(async function (resolve, reject) {
//     try {
//       request.get({
//         "headers": {
//           "content-type": "application/json"
//         },
//         "url": "http://" + process.env.AUTH_SERVICE_HOST + "/authentication/check/" + token,
//       }, function (error, response, body) {

//         if (error) {
//           console.log('Error checking token => ', error)
//           reject(process.env.ERRORINTERNAL_RESPONSE);
//         } else {
//           let result = JSON.parse(body);
//           resolve(result);
//         }
//       })
//     } catch (e) {
//       console.log('Error checking token => ', e)
//       reject(process.env.ERRORINTERNAL_RESPONSE);
//     }
//   })
// }

// exports.checkSignature = function (signature) {
//   return new Promise(async function (resolve, reject) {
//     let result = {}
//     let svUrl = process.env.AUTH_SERVICE_HOST + "/signatureValidation";
//     request.post({
//       "headers": {
//         "signature": signature
//       },
//       "method": "POST",
//       "url": svUrl
//     }, (error, response, body) => {
//       console.log('body =>',error)
//       if (error) {
//         result.responseCode = process.env.ERRORINTERNAL_RESPONSE;
//         result.responseMessage = "Internal server error, please try again!";
//       } else {
//         result = JSON.parse(body);
//       }
//       // console.log('RESULT CHECK SIGNATURE ==> ', result);
//       resolve(result);
//     });
//   })
// }

// exports.checkCustomerSignature = function (signature) {
//   return new Promise(async function (resolve, reject) {
//     let result = {}
//     let svUrl = process.env.AUTH_SERVICE_HOST + "/customerSignatureValidation";
//     request.post({
//       "headers": {
//         "signature": signature
//       },
//       "method": "POST",
//       "url": svUrl
//       // "host": 'eternagame.wikia.com',
//       // "port": 8080,
//       // "path": '/wiki/EteRNA_Dictionary'      
//     }, async (error, response, body) => {
//       if (error) {
//         result.responseCode = process.env.ERRORINTERNAL_RESPONSE;
//         result.responseMessage = "Internal server error, please try again!";
//       } else {
//         result = JSON.parse(body);
//       }
//       resolve(result);
//     });
//   })
// }

// exports.checkSecretKey = function (secretKey) {
//   return new Promise(async function (resolve, reject) {
//     let result = {}
//     let svUrl = process.env.AUTH_SERVICE_HOST + "/screetKeyValidation";
//     request.post({
//       "headers": {
//         "screetkey": secretKey
//       },
//       "method": "POST",
//       "url": svUrl
//     }, (error, response, body) => {
//       if (error) {
//         result.responseCode = process.env.ERRORINTERNAL_RESPONSE;
//         result.responseMessage = "Internal server error, please try again!";
//       } else {
//         result = JSON.parse(body);
//       }
//       resolve(result);
//     });
//   })
// }

exports.isValidService = function (code) {
  console.log("code: ", code);
  console.log("service: ", serviceJson);
  let result = false;
  for (let service of serviceJson) {
    if (service.code == code) {
      result = service.name;
      break;
    }
  }
  console.log("result: ", result);
  return result;
}