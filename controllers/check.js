'use strict';

const request = require('request');
let message = {};

var mongoose = require('mongoose').set('debug', true);
var mongo = require('../config/mongo');
var accountSchema = require('../config/accountSchema');
var otpSchema = require('../config/otpSchema');
var authService = require('../service/authService');
const serviceJson = require('../service.json');

exports.identifier = function (token) {
  return new Promise(async function (resolve, reject) {
    try {
      request.get({
        "headers": {
          "content-type": "application/json",
          "token": token
        },
        "url": process.env.AUTH_SERVICE_HOST + "/identifier?v=1&flowEntry=ultipage"
      }, async function (error, response, body) {
        if (error) {
          console.log('Error bridging to auth service for checking token => ', error)
          message = {
            "responseCode": process.env.ERRORINTERNAL_RESPONSE,
            "responseMessage": "Internal server error. Try again later!"
          }
          resolve(message);
        } else {
          // check if 'Too many requests, please try again later.'
          console.log('identifier response =>',body)
          var b = body.toLowerCase();
          b = b.substr(0,17)
          if(b == 'too many requests') {
            message = {
              "responseCode": '429',
              "responseMessage": body
            }  
            resolve(message)
          }else{
            body = JSON.parse(body);
            let fa = await findDataAccount(token);
            if (body.responseCode == process.env.SUCCESS_RESPONSE) { // kalau token success / token masih aktif maka cari data di database
              if (fa.responseCode == process.env.SUCCESS_RESPONSE) {
                resolve(fa);
              } else {
                console.log('Token active but no data in account database')
                resolve({
                  responseCode: process.env.UNAUTHORIZED_RESPONSE,
                  responseMessage: "Unauthorize"
                })
              }
            } else { // jika tidak aktif lagi / unauthorize (401) maka login kembali => 
              if (fa.responseCode == process.env.SUCCESS_RESPONSE) {
                let acc = {
                  phone: fa.data.phone,
                  phoneCode: fa.data.phoneCode,
                  appSignature: fa.data.appSignature,
                  deviceId: fa.data.deviceId,
                  token: token
                }
                // logout token
                let logout = await authService.logoutUltipage(token);
                let auth = await authService.loginUltipage(acc);
                if (parseInt(logout.responseCode) == process.env.SUCCESS_RESPONSE) {
                  if (parseInt(auth.responseCode) == process.env.SUCCESS_RESPONSE) {
                    console.log('masuk sini')
                    // lanjut update token ke database account
                    acc.newToken = auth.data.token;
                    let update = await updateLoginAccount(acc);
                    resolve(update);
                  } else {
                    console.log('masuk sana')
                    resolve({
                      responseCode: process.env.UNAUTHORIZED_RESPONSE,
                      responseMessage: 'Unauthorize'
                    })
                  }
                } else {
                  resolve({
                    responseCode: process.env.UNAUTHORIZED_RESPONSE,
                    responseMessage: 'Unauthorize'
                  })
                }
              } else {
                console.log('Token NOT active and NO DATA in account database')
                resolve({
                  responseCode: process.env.UNAUTHORIZED_RESPONSE,
                  responseMessage: "Please login again!"
                })
              }
            }
          }
        }
      });
    } catch (e) {
      console.log('Error checking identifier ===> ', e)
      reject(process.env.ERRORINTERNAL_RESPONSE);
    }
  })
}

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