require('dotenv').config();
const request = require('request');
var mongoose = require('mongoose').set('debug', true);
var mongo = require('../config/mongo');
var accountSchema = require('../config/accountSchema');
var otpSchema = require('../config/otpSchema');
var authService = require('../service/authService');
var masterService = require('../service/masterService');
const pgCon = require('../config/pgConfig');
let message = {};
const asim = require('../config/asymmetric');
const fs = require('fs');
const pub = fs.readFileSync('./publicKey.key', 'utf8');
const aes_key = process.env.AES_KEY_SERVER;
const aes_iv = process.env.AES_IV_SERVER;
const argon2 = require('argon2');

const kredential = process.env.KREDENTIAL_KEY
const Cryptr = require('cryptr');
const cryptr = new Cryptr(kredential)
const log = require('../config/log');
var logObj = {}, dataObj = {};
const notification = require('../config/notification');

function registerAccount(data) {
    return new Promise(async function (resolve, reject) {
        var res = {};
        try {
            var priorDate = new Date();
            var expDay = priorDate.getDate();
            var expMonth = priorDate.getMonth() + 1;
            var expYear = priorDate.getFullYear();
            let tmpMonth = ("0" + expMonth).slice(-2); //convert bulan supaya selalu 2 digits
            let tmpDate = ("0" + expDay).slice(-2); //convert hari supaya selalu 2 digits
            var convertDate = expYear + "-" + tmpMonth + "-" + tmpDate;
            var dateObj = new Date().getTime();
            const password = await argon2.hash(data.phone + ':' + data.password);
            await mongoose.connect(mongo.mongoDb.url, {
                useNewUrlParser: true
            });
            
            var newAccount = new accountSchema({
                fullname: data.fullname,
                email: data.email,
                phone: data.phone,
                password: password,
                originPassword: data.password,
                language: 'en',
                createdAt: convertDate,
                createdTime: dateObj,
            });
            var saveAcc = await newAccount.save();
            console.log('saveAcc ==> ', saveAcc)
            await mongoose.connection.close();
            if (saveAcc) {
                res.responseCode= process.env.SUCCESS_RESPONSE,
                res.responseMessage= 'Success'
            } else {
                res.responseCode= process.env.NOTACCEPT_RESPONSE,
                res.responseMessage= 'Failed'
            }           
            resolve(res);
        } catch (e) {
            console.log('Error save register account ==> ', e);
            res.responseCode = process.env.ERRORINTERNAL_RESPONSE,
            res.responseMessage = 'Internal server error, please try again!'
            resolve(res);
        }
    })
}

async function checkAccountUltipage(data) {
    let res = {};
    try {
        // open connection for find data by phone in ultipage
        mongoose.Promise = global.Promise;
        await mongoose.connect(mongo.mongoDb.url, {
            useNewUrlParser: true
        });
        let query = await accountSchema.findOne({
            "phone": data.phone
        });
        await mongoose.connection.close();
        // close connection for find data by phone in ultipage
        if (query === null) {
            mongoose.Promise = global.Promise;
            await mongoose.connect(mongo.mongoDb.url, {
                useNewUrlParser: true
            });
            let q = await accountSchema.findOne({
                "email": data.email
            });
            await mongoose.connection.close();
            if (q === null) {
                res.responseCode = process.env.NOTFOUND_RESPONSE;
                res.responseMessage = 'Not found';
                return res;
            } else {
                res.responseCode = process.env.NOTACCEPT_RESPONSE;
                res.responseMessage = 'Account already exist';
                res.data = q
                return res;
            }
        } else {
            res.responseCode = process.env.NOTACCEPT_RESPONSE;
            res.responseMessage = 'Account already exist';
            return res;
        }
    } catch (e) {
        console.log('Error check account on ultipage ==> ', e);
        res.responseCode = process.env.ERRORINTERNAL_RESPONSE;
        res.responseMessage = 'Internal server error, please try again!';
        return (res);
    }
}

async function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.registerAccount = function (body) {
    return new Promise(async function (resolve, reject) {
        try {
            console.log('body =>', body)
            if (!body.phone) {
                message = {
                    "responseCode": process.env.NOTACCEPT_RESPONSE,
                    "responseMessage": "Phone required"
                }
                resolve(message);
            }
            if (!body.fullname) {
                message = {
                    "responseCode": process.env.NOTACCEPT_RESPONSE,
                    "responseMessage": "Fullname required"
                }
                resolve(message);
            }
            if (!body.appId) {
                message = {
                    "responseCode": process.env.NOTACCEPT_RESPONSE,
                    "responseMessage": "App ID required"
                }
                resolve(message);
            }

            let cd = await checkAccountUltipage(body);
            console.log('check regist account => ', cd);
            if (cd.responseCode == process.env.NOTFOUND_RESPONSE) {
                // check data register on account service
                let cr = await registerAccount(body);
                console.log('registerAccount ==> ', cr)
                resolve(cr);
            } else {
                resolve(cd);
            }
        } catch (e) {
            console.log('Error register account => ', e)
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}
async function getProfileAccount(data) {
    try {
        // open connection for find data by phone in ultipage
        let where = {};
        if (data.phone && data.phoneCode) {
            where.phone = data.phone;
            where.phoneCode = data.phoneCode;
        }
        if (data.merchantId) {
            where.merchantId = data.merchantId;
        }

        mongoose.Promise = global.Promise;
        await mongoose.connect(mongo.mongoDb.url, {
            useNewUrlParser: true
        });
        let query = await accountSchema.findOne(where);
        await mongoose.connection.close();
        // close connection for find data by phone in ultipage
        if (query === null) {
            return ({
                responseCode: process.env.NOTFOUND_RESPONSE,
                responseMessage: "Not found"
            })
        } else {
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: "Success",
                data: query
            })
        }
    } catch (e) {
        console.log('Error get profile merchant ==> ', e);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: 'Internal server error, please try again!'
        })
    }
}

function randomString() {
    var chars = "0123456789";
    var string_length = 4;
    var randomstring = '';
    for (var i = 0; i < string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum, rnum + 1);
    }
    return randomstring;
}

async function generateUrlName(data) {
    var split = data.split(' ');
    split = split.join('');
    return split.toLowerCase();
}

exports.loginUltipage = function (data) {
    console.log('loginUltipage data =>', data)
    return new Promise(async function (resolve, reject) {
        try {
            data.apiService = process.env.SERVICE_CODE;
            request.post({
                "headers": {
                    "content-type": "application/json",
                    "signature": data.appSignature,
                    "apiService": data.apiService
                },
                "body": data,
                "json": true,
                "url": process.env.AUTH_SERVICE_HOST + "/signin?continue=http://localhost:3080&flowEntry=dot"
            }, async function (error, response, body) {
                console.log('BODY ==> ', body)
                if (error) {
                    console.log('Error bridging to account service => ', error)
                    message = {
                        "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                        "responseMessage": "Internal server error. Try again later!"
                    }
                    resolve(message);
                } else {
                    resolve(body);
                }
            });
        } catch (e) {
            console.log('Error login ultipage ===> ', e);
            return ({
                responseCode: process.env.ERRORINTERNAL_RESPONSE,
                responseMessage: 'Internal server error, please try again!'
            })
        }
    })
}

exports.logoutUltipage = function (token) {
    return new Promise(async function (resolve, reject) {
        try {
            request.post({
                "headers": {
                    "content-type": "application/json",
                    "token": token,
                    "signature": ''
                },
                "url": process.env.AUTH_SERVICE_HOST + "/logout?continue=http://localhost:3080&flowEntry=dot"
            }, async function (error, response, body) {
                console.log('BODY LOGOUT ULTIPAGE ==> ', body)
                if (error) {
                    console.log('Error bridging to Auth service => ', error)
                    message = {
                        "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                        "responseMessage": "Internal server error. Try again later!"
                    }
                    resolve(message);
                } else {
                    resolve(JSON.parse(body))
                }
            });
        } catch (e) {
            console.log('Error login ultipage ===> ', e);
            return ({
                responseCode: process.env.ERRORINTERNAL_RESPONSE,
                responseMessage: 'Internal server error, please try again!'
            })
        }
    })
}
exports.otpSend = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            let cat = "otp_ultipage_merchant";
            let notificationUrl = '';
            if(process.env.BUILD == "PRODUCTION"){
                notificationUrl = process.env.NOTIFICATION_HOST + "/sendNotif/sms";
            } else {
                notificationUrl = process.env.NOTIFICATION_HOST + "/sendNotif/email"; // runing
            }
            console.log('Notification URL = ' + notificationUrl);
            request.post({
                "headers": {
                    "content-type": "application/json",
                    "signature": "dWx0aXBhZ2VNZXJjaGFudFdlYjpkV3gwYVhCaFoyVk5aWEpqYUdGdWRGZGxZanAxYkhReGNEUm5NMDB6Y21Ob05HNTBWek5p" //masih hardcode
                },
                "url": notificationUrl,
                "body": {
                    "category": cat,
                    "fullname": data.fullname,
                    "email": data.email,
                    "phoneCode": data.phoneCode,
                    "phone": data.phone,
                    "otpCode": data.otpCode,
                    "html": data.html
                },
                "json": true
            }, async (error, response, body) => {
                let message = {}
                if (error) {
                    console.log('Error bridging sending notif in OTP => ', error);
                    message = {
                        responseCode: 500,
                        responseMessage: 'Internal server error, please try again!'
                    }
                    reject(message);
                } else {
                    if (body.responseCode == process.env.SUCCESS_RESPONSE) {
                        console.log('Success send otp to email');
                        message = {
                            responseCode: 200,
                            responseMessage: 'Success'
                        }
                    } else {
                        console.log('Something problem sending otp code to email', body);
                        message = {
                            responseCode: 500,
                            responseMessage: 'Internal server error, please try again!'
                        }
                    }
                    resolve(message);
                }
            })
        } catch (e) {
            console.log('Error otpSend ===> ', e);
            return ({
                responseCode: process.env.ERRORINTERNAL_RESPONSE,
                responseMessage: 'Internal server error, please try again!'
            })
        }
    })
}
exports.loginAccount = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            if (!data.phone) {
                resolve({
                    responseCode: process.env.NOTACCEPT_RESPONSE,
                    responseMessage: "Phone required"
                })
                return;
            }
            let cd = await checkDataAccount(data);
            console.log('checkDataAccount =>', cd)
            resolve(cd);

        } catch (e) {
            console.log('Error login Ultipage ==> ', e);
            notification.sendErrorNotification(e.stack);
            resolve({
                responseCode: process.env.ERRORINTERNAL_RESPONSE,
                responseMessage: "Internal server error, please try again!"
            })
        }
    })
}

exports.getAccount = function (d) {
    return new Promise(async function (resolve, reject) {
        try {
            var data = d.param
            if (!data.phone) {
                resolve({
                    responseCode: process.env.NOTACCEPT_RESPONSE,
                    responseMessage: "Phone required"
                })
                return;
            }


            // check account data ultipage first
            let cd = await checkDataAccount(data);
            console.log('checkDataAccount =>', cd)
            if (cd.responseCode == process.env.SUCCESS_RESPONSE) {
                // next step update OTP
                resolve(cd);
            } else {
                resolve(cd);
            }

            // let la = await authService.loginUltipage(data);
            // if (la.responseCode == process.env.SUCCESS_RESPONSE) {
            //     data.token = la.data.token;
            //     let ut = await updateTokenUltipageAccount(data);
            //     resolve(la);
            // } else {
            //     resolve(la);
            // }
        } catch (e) {
            console.log('Error login Ultipage ==> ', e);
            resolve({
                responseCode: process.env.ERRORINTERNAL_RESPONSE,
                responseMessage: "Internal server error, please try again!"
            })
        }
    })
}

async function checkDataAccount(data) {
    try {
        var res = {};
        mongoose.Promise = global.Promise;
        await mongoose.connect(mongo.mongoDb.url, {
            useNewUrlParser: true
        });
        let query = await accountSchema.findOne({
            "phone": data.phone
        });
        await mongoose.connection.close();
        if (query === null) {            
            res = {
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: "Not found"
            }
        } else {
            if(data.password) {
                let password = data.phone + ":" + data.password;
                console.log('password =>',password)
                console.log('query =>',query)
                let check = await argon2.verify(query.password, password);
                console.log('argon2 check =>', check)
                if(check) {
                    res = {
                        responseCode: process.env.SUCCESS_RESPONSE,
                        responseMessage: "Success",
                        data: query
                    }    
                }else{
                    res = {
                        responseCode: process.env.NOTACCEPT_RESPONSE,
                        responseMessage: "Not found"
                    }    
                }
            }else{      
                res = {
                    responseCode: process.env.SUCCESS_RESPONSE,
                    responseMessage: "Success"
                }
            }
        }
        return (res)
    } catch (e) {
        console.log('Error check data account ==> ', e);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

function loginAccount(credential, data) {
    return new Promise(async function (resolve, reject) {
        try {
            request.post({
                "headers": {
                    "content-type": "application/json",
                    "signature": credential.signature
                },
                "url": process.env.AUTH_SERVICE_HOST + "/signin?continue=" + credential.continue+"&flowEntry=" + credential.flowEntry,
                "body": data,
                "json": true,
            }, async function (error, response, body) {
                console.log('RESULT BODY LOGIN ULTIPAGE ==> ', body)
                if (error) {
                    console.log('Error bridging to Auth service => ', error)
                    message = {
                        "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                        "responseMessage": "Internal server error. Try again later!"
                    }
                    resolve(message);
                } else {
                    resolve(body);
                }
            });
        } catch (e) {
            console.log('Error login account ==> ', e);
            resolve({
                responseCode: process.env.ERRORINTERNAL_RESPONSE,
                responseMessage: "Internal server error, please try again!"

            })
        }
    })
}

exports.logoutAccount = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            data.apiService = process.env.SERVICE_CODE;
            request.post({
                "headers": {
                    "content-type": "application/json",
                    "token": data.token,
                    "signature": ""
                },
                "url": process.env.AUTH_SERVICE_HOST + "/logout?continue=http://localhost:3080&flowEntry=dot"
            }, async function (error, response, body) {
                console.log('BODY ==> ', body)
                if (error) {
                    console.log('Error bridging to auth service => ', error)
                    message = {
                        "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                        "responseMessage": "Internal server error. Try again later!"
                    }
                    resolve(message);
                } else {
                    resolve(body);
                }
            });
        } catch (e) {
            console.log('Error login ultipage ===> ', e);
            return ({
                responseCode: process.env.ERRORINTERNAL_RESPONSE,
                responseMessage: 'Internal server error, please try again!'
            })
        }
    })
}
exports.checkAccountUltipage = function (data) { // checking account for edit profile
    console.log('checkAccountUltipage =>', data)
    return new Promise(async function (resolve, reject) {
        try {
            let cd = await checkAccountUltipage(data);
            resolve(cd);
        } catch (e) {
            console.log('Error checkAccountUltipage ===> ', e);
            return ({
                responseCode: process.env.ERRORINTERNAL_RESPONSE,
                responseMessage: 'Internal server error, please try again!'
            })
        }
    })
}
exports.updateDeviceId = function (data) { // checking account for edit profile
    console.log('updateDeviceId =>', data)
    return new Promise(async function (resolve, reject) {
        try {
            let cd = await updateDeviceId(data);
            resolve(cd);
        } catch (e) {
            console.log('Error updateDeviceId ===> ', e);
            return ({
                responseCode: process.env.ERRORINTERNAL_RESPONSE,
                responseMessage: 'Internal server error, please try again!'
            })
        }
    })
}
async function updateDeviceId(data) {
    let res = {};
    try {
        var query = `update "MerchantAccounts" set "deviceId"=$1, "updatedAt"=$2 where "merchantId"=$3 RETURNING *`;
        var param = [data.deviceId, 'NOW()', data.merchantId];
        console.log('updateDeviceId =>', {query: query, param: param});
        var exe = await pgCon.query(query, param);
        if(exe.rowCount > 0) {
            res.responseCode = process.env.SUCCESS_RESPONSE;
            res.responseMessage = 'Success';    
        }else{
            res.responseCode = process.env.NOTFOUND_RESPONSE;
            res.responseMessage = 'Not Found';    
        }
        return (res);

    } catch (e) {
        console.log('Error check account on ultipage ==> ', e);
        res.responseCode = process.env.ERRORINTERNAL_RESPONSE;
        res.responseMessage = 'Internal server error, please try again!';
        return (res);
    }
}


async function findAccountByArrId(arrId) {
    try {
        mongoose.Promise = global.Promise;
        await mongoose.connect(mongo.mongoDb.url);
        let tc = await accountSchema.find({
            "merchantId": { "$in" : arrId }
        });
        await mongoose.connection.close();
        if (tc === null) {
            return ({
                responseCode: process.env.NOTFOUND_RESPONSE,
                responseMessage: "Data Not Found"
            })
        } else {
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: "Success",
                data: tc
            })
        }
    } catch (e) {
        console.log('Error findAccountByDeviceId ==> ', e);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}