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
const emailFooter = `<div style="width:100%; margin:0 auto; height: 65px; background:#144371; padding:15px; display: flex;">
<div style="width:50%; text-align: left; padding: 20px; padding-left: 30px; color: white;">
    <div style="display:inline; font-size: 20px;">DOWNLOAD OUR APP  </div>
    <div style="display:inline; padding-left: 2%; font-size: 20px;"> > </div>
</div>
<div style="width:50%; text-align: left; padding-left: 0px; margin-top: -6px; display: block;">
    <a href="#" style="width: 45%; margin-right: 4%;"><img style="padding-top: 18px;" src="`+process.env.ULTIPAGE_COMPROF_URL+process.env.ULTIPAGE_MERCHANT_PUBLIC_IMG_PATH+`email/app-store-badge.png" /></a>
    <a href="https://play.google.com/store/apps/details?id=id.co.usahakreatif.ultipage.partner" style="width: 45%;"><img style="padding-top: 18px;" src="`+process.env.ULTIPAGE_COMPROF_URL+process.env.ULTIPAGE_MERCHANT_PUBLIC_IMG_PATH+`email/google-play-store-badge.png" /></a>
</div>
</div>
<div style="width:100%; display: flow-root; height: 250px; background:#ECF0F3; padding:15px;">
<div style="width:100%; height: 40px; margin-top: 30px; margin-bottom: 20px; display: block; text-align: center;">
    <a href="`+process.env.ULTIPAGE_COMPROF_URL+`" style="margin-left: 15px; margin-right: 15px; color: transparent;">
        <img src="`+process.env.ULTIPAGE_COMPROF_URL+process.env.ULTIPAGE_MERCHANT_PUBLIC_IMG_PATH+`email/icon-ios-globe.png" style="min-width: 25px; min-height: 25px;"/>
    </a>
    <a href="https://www.facebook.com/ultipage/" style="margin-left: 15px; margin-right: 15px; color: transparent;">
        <img src="`+process.env.ULTIPAGE_COMPROF_URL+process.env.ULTIPAGE_MERCHANT_PUBLIC_IMG_PATH+`email/icon-facebook.png" style="min-width: 25px; min-height: 25px;"/>
    </a>
    <a href="https://www.instagram.com/ultipage.id/?hl=id" style="margin-left: 15px; margin-right: 15px; color: transparent;">
        <img src="`+process.env.ULTIPAGE_COMPROF_URL+process.env.ULTIPAGE_MERCHANT_PUBLIC_IMG_PATH+`email/icon-instagram.png" style="min-width: 25px; min-height: 25px;"/>
    </a>
    <a href="https://twitter.com/ultipage" style="margin-left: 15px; margin-right: 15px; color: transparent;">
        <img src="`+process.env.ULTIPAGE_COMPROF_URL+process.env.ULTIPAGE_MERCHANT_PUBLIC_IMG_PATH+`email/icon-twitter.png" style="min-width: 25px; min-height: 25px;"/>
    </a>
    <a href="https://vt.tiktok.com/ZGJDGtJPJ/" style="margin-left: 15px; margin-right: 15px; color: transparent;">
        <img src="`+process.env.ULTIPAGE_COMPROF_URL+process.env.ULTIPAGE_MERCHANT_PUBLIC_IMG_PATH+`email/icon-tiktok.png" style="min-width: 25px; min-height: 25px;"/>
    </a>
</div>
<div style="width:100%; height: 40px; display: block;">
    <p style="text-align: center;">
        <a style="color: #737678; font-size: 14px;" href="`+process.env.ULTIPAGE_COMPROF_URL+`privacy-policy"> Privacy Policy</a>
        <a style="color: #737678; margin-left: 10px; margin-right: 10px;"> &#8226; </a>
        <a style="color: #737678; font-size: 14px;" href="`+process.env.ULTIPAGE_COMPROF_URL+`faq"> FAQs </a>
        <a style="color: #737678; margin-left: 10px; margin-right: 10px;"> &#8226; </a>
        <a style="color: #737678; font-size: 14px;" href="mailto:`+process.env.ULTIPAGE_SUPPORT_EMAIL+`"> Contact Us </a>
    </p>
</div>
<div style="width:100%; height: 40px; display: block; margin-bottom: 20px;">
    <p style="text-align: center; color: #737678; font-size: 12px;"> This e-mail is auto generated. Please do not reply to this email. </p>
    <p style="text-align: center; color: #737678; margin-top: -10px; font-size: 12px;"> Add <u> `+process.env.ULTIPAGE_SUPPORT_EMAIL+` </u> to your contact to make sure our email reaches your inbox </p>
</div>
<hr style="width:100%; display: block; margin-top: 10px; margin-bottom: 10px; border-top: 1px solid #737678; border-width: thin 0 0 0; opacity: 0.5;">
<div style="width:100%; height: 20px; margin-top: 20px; display: block; text-align: center;">
    <p style="color: #737678; font-size: 12px;"> &#169; 2021 Ultipage | Pakuwon Center | Jl. Embong Malang No. 1-5 | Surabaya, Jawa Timur 60261 | Indonesia </p>
</div>        
</div>`;

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

// confirm OTP on central database
function confirmOtpAccount(data) {
    return new Promise(async function (resolve, reject) {
        try {
            data.signature = asim.encryptAes(data.signature, aes_key, aes_iv);
            data.accountPriority = "partner"
            console.log('data confirm otp => ', data)
            request.post({
                "headers": {
                    "content-type": "application/json",
                    // "version": "2",
                    "signature": data.signature,
                    "apiService": data.apiService
                },
                "body": data,
                "json": true,
                "url": process.env.ACCOUNT_SERVICE_LOCAL_HOST + "/otp/confirm"
            }, async function (error, response, body) {
                console.log('BODY CONFIRM OTP ==> ', body)
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
            console.log('Error check register account ==> ', e);
            res.responseCode = process.env.ERRORINTERNAL_RESPONSE;
            res.responseMessage = 'Internal server error, please try again!';
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


exports.saveUltipageOtp = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            console.log('DATA ULTIPAGE OTP ==> ', data)
            var priorDate = new Date();
            var expDay = priorDate.getDate();
            var expMonth = priorDate.getMonth() + 1;
            var expYear = priorDate.getFullYear();
            let tmpMonth = ("0" + expMonth).slice(-2); //convert bulan supaya selalu 2 digits
            let tmpDate = ("0" + expDay).slice(-2); //convert hari supaya selalu 2 digits
            var convertDate = expYear + "-" + tmpMonth + "-" + tmpDate;
            var dateObj = new Date().getTime();
            // check otp => if exist update otp, if not exist insert otp
            let find = await findOtp(data);
            console.log('findOtp => ', find)
            if (find.responseCode == process.env.SUCCESS_RESPONSE) {
                if (data.answer && data.answer == "yes") {
                    data.confirmationCode = await generateOtp()
                }
                let update = await updateOtp(data);
                resolve(update);
            } else {
                console.log('masuk sini')
                await mongoose.connect(mongo.mongoDb.url, {
                    useNewUrlParser: true
                });
                var newOtp = new otpSchema({
                    phoneCode: data.phoneCode,
                    phone: data.phone,
                    otpCode: data.confirmationCode,
                    status: '0',
                    deviceId: data.deviceId,
                    createdAt: convertDate,
                    createdTime: dateObj
                });
                var saveOtp = await newOtp.save();
                await mongoose.connection.close();
                resolve({
                    responseCode: process.env.SUCCESS_RESPONSE,
                    responseMessage: "Success",
                    data: saveOtp
                });
            }
        } catch (e) {
            console.log('Error save ultipage OTP ==> ', e);
            resolve({
                responseCode: process.env.ERRORINTERNAL_RESPONSE,
                responseMessage: "Internal server error, please try again!"
            })
        }
    })
}

async function saveMerchantData(data) {
    console.log('saveMerchantData =>', data)
    try {
        let phoneNumber = data.phoneCode + '' + data.phone;
        let save = `INSERT INTO "Merchants" ("name","canOrder","imageUrl","description","createdAt","whatsappNumber","urlName") VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`;
        let param = [data.fullname, "false", '', '', 'NOW()', phoneNumber, data.urlName];
        let exc = await pgCon.query(save, param);
        if (exc.rowCount > 0) {
            var merchantId = exc.rows[0].id;
            var urlName = data.urlName+merchantId;
            //handling duplicate urlName
            save = `update "Merchants" set "urlName"=$1 where id=$2`;
            param = [urlName, merchantId];
            await pgCon.query(save, param);

            if(data.cityId) {
                save = `INSERT INTO "MerchantCity" ("merchantId","cityId") VALUES ($1,$2) RETURNING *`;
                param = [merchantId, data.cityId];
                await pgCon.query(save, param);
            }
            if(data.categoryId) {
                save = `INSERT INTO "MerchantCategory" ("merchantId","categoryId") VALUES ($1,$2) RETURNING *`;
                param = [merchantId, data.categoryId];
                console.log('MerchantCategory =>',save,param)
                await pgCon.query(save, param);
            }
            if(data.subCategoryId) {
                save = `INSERT INTO "MerchantSubCategory" ("merchantId","subCategoryId") VALUES ($1,$2) RETURNING *`;
                param = [merchantId, data.subCategoryId];
                console.log('MerchantSubCategory =>',save,param)
                await pgCon.query(save, param);
            }                        
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: 'Success',
                data: exc.rows
            })
        } else {
            return ({
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: 'Failed'
            })
        }
    } catch (e) {
        console.log('Error save merchant data ==> ', e);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: 'Internal server error, please try again!'
        })
    }
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

async function updateOtp(data) {
    try {
        let whereValues = {
            phoneCode: data.phoneCode,
            phone: data.phone,
            status: "0"
        };
        let newValues = {
            otpCode: data.confirmationCode
        };
        let sorting = {
            "createdDate": "-1"
        };
        mongoose.Promise = global.Promise;
        await mongoose.connect(mongo.mongoDb.url);
        let tc = await otpSchema.findOneAndUpdate(whereValues, {
            $set: newValues
        }, {
            new: true,
            sort: sorting
        });
        if (tc) {
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: "Success",
                data: tc
            })
        } else {
            return ({
                responseCode: process.env.NOTFOUND_RESPONSE,
                responseMessage: "Not found"
            })
        }
    } catch (e) {
        console.log('Error confirm ultipage OTP ==> ', e);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

async function findOtp(data) {
    try {
        console.log("DATA => ", data)
        if(!data.phoneCode) { data.phoneCode='+62' // antisipasi jika tidak ada phone code
        }
        mongoose.Promise = global.Promise;
        await mongoose.connect(mongo.mongoDb.url);
        let tc = await otpSchema.findOne({
            "phoneCode": data.phoneCode,
            "phone": data.phone,
            "status": '0'
        });
        await mongoose.connection.close();
        if (tc === null) {
            return ({
                responseCode: process.env.NOTFOUND_RESPONSE,
                responseMessage: "OTP already used. Please request again"
            })
        } else {
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: "Success",
                data: tc
            })
        }
    } catch (e) {
        console.log('Error confirm ultipage OTP ==> ', e);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}
async function findAndUpdateOtp(data) {
    try {
        console.log("DATA => ", data)
        var sortLatest = {
            "createdDate": "-1"
        };
        mongoose.Promise = global.Promise;
        await mongoose.connect(mongo.mongoDb.url);
        let tc = await otpSchema.findOneAndUpdate({
            "phone": data.phone,
            "phoneCode": data.phoneCode,
            "otpCode": data.otpCode,
        }, {
            $set: {
                "status": '0',
            }
        }, {
            new: true,
            sort: sortLatest
        });
        await mongoose.connection.close();
        if (tc === null) {
            return ({
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: "Failed"
            })
        } else {
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: "Success update OTP",
                data: tc
            })
        }

    } catch (e) {
        console.log('Error findAndUpdateOtp ==> ', e);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}
async function confirmOtp(data) {
    try {
        var sortLatest = {
            "createdDate": "-1"
        };
        mongoose.Promise = global.Promise;
        await mongoose.connect(mongo.mongoDb.url);
        let tc = await otpSchema.findOneAndUpdate({
            "phone": data.phone,
            "phoneCode": data.phoneCode,
            "otpCode": data.otpCode,
        }, {
            $set: {
                "status": '1',
            }
        }, {
            new: true,
            sort: sortLatest
        });
        await mongoose.connection.close();
        if (tc === null) {
            return ({
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: "Failed"
            })
        } else {
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: "Success OTP",
                data: tc
            })
        }
    } catch (e) {
        console.log('Error confirm ultipage OTP ==> ', e);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

// async function saveUltipageAccount(data) {
//     try {
//         console.log('DATA ULTIPAGE OTP ==> ', data)
//         var newOtp = new otpSchema({
//             phoneCode: data.phoneCode,
//             phone: data.phone,
//             otpCode: data.confirmationCode,
//             email: data.email,
//             status: '0',
//             deviceId: data.deviceId,
//             createdAt: convertDate,
//             createdTime: dateObj
//         });
//         var saveOtp = await newOtp.save();
//         await mongoose.connection.close();
//         return saveOtp;
//     } catch (e) {
//         console.log('Error save ultipage account ==> ', e);
//         return ({
//             responseCode: process.env.ERRORINTERNAL_RESPONSE,
//             responseMessage: "Internal server error"
//         })
//     }
// }

async function saveAccountSchema(data) {
    try {
        var priorDate = new Date();
        var expDay = priorDate.getDate();
        var expMonth = priorDate.getMonth() + 1;
        var expYear = priorDate.getFullYear();
        let tmpMonth = ("0" + expMonth).slice(-2); //convert bulan supaya selalu 2 digits
        let tmpDate = ("0" + expDay).slice(-2); //convert hari supaya selalu 2 digits
        var convertDate = expYear + "-" + tmpMonth + "-" + tmpDate;
        var dateObj = new Date().getTime();
        await mongoose.connect(mongo.mongoDb.url, {
            useNewUrlParser: true
        });
        console.log('DATA ULTIPAGE OTP ==> ', data)
        var newAccount = new accountSchema({
            fullname: data.fullname,
            accountId: data.accountId,
            email: data.email,
            phoneCode: data.phoneCode,
            phone: data.phone,
            accountCategory: data.accountCategory,
            userType: data.userType,
            language: 'en',
            deviceId: data.deviceId,
            createdAt: convertDate,
            createdTime: dateObj,
            appSignature: data.appSignature,
            signature: data.signature
        });
        var saveAcc = await newAccount.save();
        await mongoose.connection.close();
        if (saveAcc) {
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: 'Success'
            })
        } else {
            return ({
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: 'Failed'
            })
        }
    } catch (e) {
        console.log('Error save account schema ==> ', e);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

function getDataAccount(data) {
    return new Promise(async function (resolve, reject) {
        try {
            let par = {
                phone: data.phone,
                phoneCode: data.phoneCode
            }
            request.get({
                "headers": {
                    "content-type": "application/json",
                    "apiService": data.apiService,
                    "param": JSON.stringify(par)
                },
                "url": process.env.ACCOUNT_SERVICE_LOCAL_HOST + "/data/partner"
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
                    resolve(JSON.parse(body));
                }
            });
        } catch (e) {
            console.log('Error get data account ==> ', e);
            resolve({
                responseCode: process.env.ERRORINTERNAL_RESPONSE,
                responseMessage: "Internal server error, please try again!"
            })
        }
    })
}

async function updateTokenUltipageAccount(data) {
    let set = {};
    try {
        var sortLatest = {
            "createdDate": "-1"
        };
        set.token = data.token;
        if (data.merchantId) {
            set.merchantId = data.merchantId;
        }
        if (data.accountId) {
            set.accountId = data.accountId;
        }
        mongoose.Promise = global.Promise;
        await mongoose.connect(mongo.mongoDb.url);
        let tc = await accountSchema.findOneAndUpdate({
            "phone": data.phone,
            "phoneCode": data.phoneCode,
            "userType": "ultipage"
        }, {
            $set: set
        }, {
            new: true,
            sort: sortLatest
        });
        await mongoose.connection.close();
        if (tc) {
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: "Success",
                data: tc
            })
        } else {
            return ({
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: "Failed"
            })
        }
    } catch (e) {
        console.log('Error update token ultipage account ===> ', e);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: 'Internal server error, please try again!'
        })
    }
}


async function saveMerchantDeviceAccount(data) {
    try {
        let ins = 'INSERT INTO "MerchantAccounts" ("merchantId","accountId","deviceId","createdAt") VALUES ($1,$2,$3,$4)';
        let param = [data.merchantId, data.accountId, data.deviceId, 'NOW()'];
        let exc = await pgCon.query(ins, param);
        if (exc.rowCount > 0) {
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: 'Success'
            })
        } else {
            return ({
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: 'Failed'
            })
        }
    } catch (e) {
        console.log('Error save merchant device account ==> ', e)
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: 'Internal server error, please try again!'
        })
    }
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

exports.otpConfirmation = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            console.log("otpConfirmation DATA => ", data)
            if (!data.phoneCode) {
                message = {
                    "responseCode": process.env.NOTACCEPT_RESPONSE,
                    "responseMessage": "Phone code required"
                }
                resolve(message);
                return;
            }
            if (!data.phone) {
                message = {
                    "responseCode": process.env.NOTACCEPT_RESPONSE,
                    "responseMessage": "Phone required"
                }
                resolve(message);
                return;
            }
            if (!data.otpCode) {
                message = {
                    "responseCode": process.env.NOTACCEPT_RESPONSE,
                    "responseMessage": "Otp code required"
                }
                resolve(message);
                return;
            }
            if (!data.deviceId) {
                message = {
                    "responseCode": process.env.NOTACCEPT_RESPONSE,
                    "responseMessage": "Device ID required"
                }
                resolve(message);
                return;
            }

            if (data.phone.charAt(0) === "0") {
                data.phone = data.phone.substring(1);
            }
            let fo = await findOtp(data);
            console.log('findOtp =>', fo)
            data.apiService = process.env.SERVICE_CODE;
            if (fo.responseCode == process.env.SUCCESS_RESPONSE) {
                // compare data otp dengan yang ada di database
                if (data.otpCode.toString() == fo.data.otpCode.toString() && fo.data.status != 1) {
                    // jika menggunakan data yang sudah ada di database
                    if (data.filter == "use_exist") {
                        let gd = await getDataAccount(data); // check v2
                        console.log('GD => ', gd)
                        if (gd.responseCode == process.env.SUCCESS_RESPONSE) {
                            // confirm otp dari ultipage service
                            let confirm = await confirmOtp(data);
                            if (confirm.responseCode == process.env.SUCCESS_RESPONSE) {
                                let sign = [data.appId, data.deviceId].join('|')
                                let save = {
                                    fullname: gd.data[0].name,
                                    accountId: gd.data[0].partner_id,
                                    email: gd.data[0].partner_email,
                                    phoneCode: gd.data[0].partner_phone_code,
                                    phone: gd.data[0].phone,
                                    accountCategory: "partner",
                                    userType: "ultipage",
                                    urlName: gd.data[0].url,
                                    deviceId: data.deviceId,
                                    appSignature: data.appSignature,
                                    signature: cryptr.encrypt(sign)
                                }
                                if(data.cityId) {
                                    save.cityId = data.cityId;
                                }
                                if(data.categoryId) {
                                    save.categoryId = data.categoryId;
                                }
                                if(data.subCategoryId) {
                                    save.subCategoryId = data.subCategoryId;
                                }
                                // save.urlName = process.env.ULTIPAGE_URL_DEFAULT + await generateUrlName(save.fullname) + randomString()
                                // save account ultipage ke database kloning
                                let sv = await saveAccountSchema(save);
                                if (sv) {
                                    // save merchant data ke postgre ultipage
                                    save.log=data.log;
                                    let sm = await saveMerchantData(save);
                                    console.log('saveMerchantData sm =>',sm)
                                    //start add log
                                    dataObj = {id: sm.data[0].id, name: sm.data[0].name}
                                    logObj = {
                                        "accessor": save.fullname,
                                        "accessorId": data.phoneCode + '' + data.phone + '_' + data.deviceId,
                                        "accessorAddress": data.log.accAddress,
                                        "accessorCategory": 'merchant',
                                        'link': data.log.link,
                                        'method': data.log.method,
                                        'status': '200',
                                        'moduleName': 'Register Merchant'
                                    };
                                    var activities = {
                                        category: "Ultipage Merchant",
                                        module: "Register Merchant",
                                        description: "Register Merchant, data : "+JSON.stringify(dataObj),
                                        user_id: sm.data[0].id,
                                        user_name: save.email,
                                        crud_id: sm.data[0].id
                                    }
                                    logObj.activities = activities;
                                    var l = await log.addLog(logObj);
                                    console.log('addLog =>',l)
                                    //end add log
                                    if (sm) {
                                        let account = {
                                            phoneCode: save.phoneCode,
                                            phone: save.phone,
                                            deviceId: save.deviceId,
                                            appSignature: data.appSignature
                                        }
                                        // auto login function for ultipage after otp confirm
                                        let login = await authService.loginUltipage(account);
                                        console.log('RESULT LOGIN ===> ', login)
                                        if (login.responseCode == process.env.SUCCESS_RESPONSE) {
                                            save.merchantId = sm.data[0].id;
                                            save.token = login.data.token;
                                            // save token merchant and save merchant id
                                            let ut = await updateTokenUltipageAccount(save);
                                            console.log('update token ultipage account ==> ', ut);
                                            if (ut.responseCode == process.env.SUCCESS_RESPONSE) {
                                                // save data akun dalam 1 device
                                                let smd = await saveMerchantDeviceAccount(save);
                                                console.log('SMD ==> ', smd);
                                                if (smd.responseCode == process.env.SUCCESS_RESPONSE) {
                                                    smd.data = {
                                                        merchantId: save.merchantId,
                                                        token: save.token,
                                                        name: save.fullname,
                                                        signature: save.signature
                                                    }
                                                    console.log('SMD ====> ', smd)
                                                    resolve(smd);
                                                } else {
                                                    resolve(smd);
                                                }
                                            } else {
                                                console.log('SOMETHING PROBLEM SAVE MERCHANT ID AND TOKEN')
                                                resolve(ut);
                                            }
                                        } else {
                                            console.log('PROBLEM AUTO LOGIN ULTIPAGE ACCOUNT AFTER OTP CONFIRMATION ======');
                                            resolve(login);
                                        }
                                    } else {
                                        resolve(sm)
                                    }
                                } else {
                                    resolve(sv);
                                }
                            } else {
                                resolve(confirm)
                            }
                        } else {
                            resolve(gd);
                        }
                    } else if (data.filter === "change_phone") {
                        if (!data.oldPhone) {
                            resolve({
                                responseCode: process.env.NOTACCEPT_RESPONSE,
                                responseMessage: "Old phone required"
                            })
                            return;
                        }

                        if (!data.oldPhoneCode) {
                            resolve({
                                responseCode: process.env.NOTACCEPT_RESPONSE,
                                responseMessage: "Old phone code required"
                            })
                            return;
                        }

                        let confirm = await confirmOtp(data);
                        if (confirm.responseCode == process.env.SUCCESS_RESPONSE) {
                            let up = await masterService.updateProfile(data);
                            resolve(up);
                        } else {
                            resolve(confirm);
                        }
                    } else if (data.filter === "change_email") {
                        if (!data.oldEmail) {
                            resolve({
                                responseCode: process.env.NOTACCEPT_RESPONSE,
                                responseMessage: "Old email required"
                            })
                            return;
                        }

                        if (!data.email) {
                            resolve({
                                responseCode: process.env.NOTACCEPT_RESPONSE,
                                responseMessage: "Email code required"
                            })
                            return;
                        }

                        let confirm = await confirmOtp(data);
                        if (confirm.responseCode == process.env.SUCCESS_RESPONSE) {
                            let up = await masterService.updateProfile(data);
                            console.log('updateProfile =>', up)
                            resolve(up);
                        } else {
                            resolve(confirm);
                        }
                    } else if (data.filter == "login") {
                        let gd = await getProfileAccount(data);
                        console.log('getProfileAccount =>', gd);
                        if (gd.responseCode == process.env.SUCCESS_RESPONSE) {
                            let co = await confirmOtp(data);
                            console.log('confirmOtp =>', co)
                            if (co.responseCode == process.env.SUCCESS_RESPONSE) {
                                let au = await authService.loginUltipage(data);
                                console.log('loginUltipage =>', au)
                                if (au.responseCode == process.env.SUCCESS_RESPONSE) {
                                    let save = {
                                        token: au.data.token,
                                        phone: data.phone,
                                        phoneCode: data.phoneCode
                                    }
                                    let ut = await updateTokenUltipageAccount(save);
                                    au.data = {
                                        merchantId: gd.data.merchantId,
                                        name: gd.data.fullname,
                                        token: au.data.token,
                                        signature: gd.data.signature,
                                        appSignature: gd.data.appSignature,
                                        phone: gd.data.phone,
                                        phoneCode: gd.data.phoneCode
                                    }
                                    resolve(au);
                                } else {
                                    resolve(au);
                                }
                            } else {
                                resolve(co);
                            }
                        } else {
                            resolve(gd);
                        }
                    } else {
                        console.log('=== MASUK TANPA EXIST DATA ===')
                        let confirm = await confirmOtp(data);
                        console.log('confirmOtp =>', confirm)
                        // if success , insert data to ultipage database
                        if (confirm.responseCode == process.env.SUCCESS_RESPONSE) {
                            let co = await confirmOtpAccount(data);
                            console.log('confirmOtpAccount =>', co)
                            if (co.responseCode == process.env.SUCCESS_RESPONSE) {
                                let sign = [data.appId, data.deviceId].join('|');
                                co.data[0].userType = "ultipage";
                                co.data[0].urlName = data.urlName;
                                co.data[0].appSignature = data.appSignature;
                                co.data[0].signature = cryptr.encrypt(sign);
                                if(data.cityId) {
                                    co.data[0].cityId = data.cityId;
                                }
                                if(data.categoryId) {
                                    co.data[0].categoryId = data.categoryId;
                                }
                                if(data.subCategoryId) {
                                    co.data[0].subCategoryId = data.subCategoryId;
                                }

                                // next step save data 
                                let saveAccount = await saveAccountSchema(co.data[0]);
                                if (saveAccount) {
                                    // save merchant data ke postgre ultipage
                                    co.data[0].log=data.log;
                                    let sm = await saveMerchantData(co.data[0]);
                                    console.log('SAVE MERCHANT DATA ===> ', sm)
                                    
                                    if (sm.responseCode == process.env.SUCCESS_RESPONSE){
                                        //start add log
                                        dataObj = {id: sm.data[0].id, name: sm.data[0].name}
                                        logObj = {
                                            "accessor": sm.data[0].name,
                                            "accessorId": data.phoneCode + '' + data.phone + '_' + data.deviceId,
                                            "accessorAddress": data.log.accAddress,
                                            "accessorCategory": 'merchant',
                                            'link': data.log.link,
                                            'method': data.log.method,
                                            'status': '200',
                                            'moduleName': 'Register Merchant'
                                        };
                                        var activities = {
                                            category: "Ultipage Merchant",
                                            module: "Register Merchant",
                                            description: "Register Merchant, data : "+JSON.stringify(dataObj),
                                            user_id: sm.data[0].id,
                                            user_name: co.data[0].email,
                                            crud_id: sm.data[0].id
                                        }
                                        logObj.activities = activities;
                                        var l = await log.addLog(logObj);
                                        console.log('addLog =>',l)
                                        //end add log                                        
                                        let account = {
                                            fullname: co.data[0].fullname,
                                            phoneCode: data.phoneCode,
                                            phone: data.phone,
                                            deviceId: data.deviceId,
                                            appSignature: data.appSignature
                                        }
                                        // auto login function for ultipage after otp confirm
                                        let login = await authService.loginUltipage(account);
                                        console.log('RESULT LOGIN ===> ', login)
                                        if (login.responseCode == process.env.SUCCESS_RESPONSE) {
                                            account.merchantId = sm.data[0].id;
                                            account.token = login.data.token;
                                            account.accountId = co.data[0].id
                                            // save token merchant and save merchant id
                                            let ut = await updateTokenUltipageAccount(account);
                                            console.log('update token ultipage account ==> ', ut);
                                            if (ut.responseCode == process.env.SUCCESS_RESPONSE) {
                                                // save data akun dalam 1 device
                                                let smd = await saveMerchantDeviceAccount(account);
                                                console.log('SMD ==> ', smd);
                                                if (smd.responseCode == process.env.SUCCESS_RESPONSE) {
                                                    smd.data = {
                                                        merchantId: account.merchantId,
                                                        token: account.token,
                                                        name: account.fullname,
                                                        signature: co.data[0].signature
                                                    }
                                                    resolve(smd);
                                                } else {
                                                    resolve(smd);
                                                }
                                            } else {
                                                console.log('SOMETHING PROBLEM SAVE MERCHANT ID AND TOKEN')
                                                resolve(ut);
                                            }
                                        } else {
                                            console.log('PROBLEM AUTO LOGIN ULTIPAGE ACCOUNT AFTER OTP CONFIRMATION ======');
                                            resolve(login);
                                        }
                                    } else {
                                        resolve(sm)
                                    }
                                } else {
                                    resolve(saveAccount)
                                }
                            } else {
                                resolve(co)
                            }
                        } else {
                            resolve(confirm);
                        }
                    }
                } else {
                    message = {
                        "responseCode": process.env.NOTACCEPT_RESPONSE,
                        "responseMessage": "Invalid OTP Code"
                    }
                    resolve(message);
                    return;
                }
            } else {
                resolve(fo);
                return;
            }
        } catch (e) {
            console.log('Error otp confirmation ultipage => ', e)
            notification.sendErrorNotification(e.stack);
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

exports.otpUpdate = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            console.log("DATA => ", data)
            if (!data.phoneCode) {
                message = {
                    "responseCode": process.env.NOTACCEPT_RESPONSE,
                    "responseMessage": "Phone code required"
                }
                resolve(message);
                return;
            }
            if (!data.phone) {
                message = {
                    "responseCode": process.env.NOTACCEPT_RESPONSE,
                    "responseMessage": "Phone required"
                }
                resolve(message);
                return;
            }
            if (!data.otpCode) {
                message = {
                    "responseCode": process.env.NOTACCEPT_RESPONSE,
                    "responseMessage": "Otp code required"
                }
                resolve(message);
                return;
            }
            if (!data.deviceId) {
                message = {
                    "responseCode": process.env.NOTACCEPT_RESPONSE,
                    "responseMessage": "Device ID required"
                }
                resolve(message);
                return;
            }

            if (data.phone.charAt(0) === "0") {
                data.phone = data.phone.substring(1);
            }
            let fo = await findAndUpdateOtp(data);
            console.log('findOtp =>',fo)

            resolve(fo);
            return;
        } catch (e) {
            console.log('Error otp confirmation ultipage => ', e)
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
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
                    // "secretKey": credential.secretKey,
                    // "token": credential.token,
                    // "aes": credential.aesParam,
                    // "clientKey": credential.clientKey,
                    // "param": data
                },
                "body": data,
                "json": true,
                "url": process.env.AUTH_SERVICE_HOST + "/signin?continue=http://localhost:8888&flowEntry=ultipage"
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
                "url": process.env.AUTH_SERVICE_HOST + "/logout?continue=http://localhost:8888&flowEntry=ultipage"
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
                "url": process.env.AUTH_SERVICE_HOST + "/logout?continue=http://localhost:8888&flowEntry=ultipage"
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