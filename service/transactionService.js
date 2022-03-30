require('dotenv').config();
const request = require('request');
const md5 = require('md5');
var mongoose = require('mongoose').set('debug', true);
var mongo = require('../config/mongo');
var accountSchema = require('../config/accountSchema');
var authService = require('../service/authService');
var masterService = require('../service/masterService');
const pgCon = require('../config/pgConfig');
let message = {};
const asim = require('../config/asymmetric');
const fs = require('fs');
const pub = fs.readFileSync('./publicKey.key', 'utf8');
const aes_key = process.env.AES_KEY_SERVER;
const aes_iv = process.env.AES_IV_SERVER;

var query = '';
var param = '';
var exc = '';
const log = require('../config/log');
var logObj = {}, dataObj = {};
exports.transactionRequest = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            console.log('DATA TRANSACTION REQUEST ===> ', data)
            if (!data.paymentMethod) {
                resolve({
                    "responseCode": process.env.NOTACCEPT_RESPONSE,
                    "responseMessage": "Payment method required"
                });
                return;
            }
            // if (!data.paymentAmount) {
            //     resolve({
            //         "responseCode": process.env.NOTACCEPT_RESPONSE,
            //         "responseMessage": "Payment amount required"
            //     });
            //     return;
            // }
            if (!data.subscriptionId) {
                resolve({
                    "responseCode": process.env.NOTACCEPT_RESPONSE,
                    "responseMessage": "ID Subscription required"
                });
                return;
            }
            data.merchantId = data.profile.merchantId;
            data.merchantName = data.profile.fullname;
            data.merchantEmail = data.profile.email;
            data.merchantPhoneCode = data.profile.phoneCode;
            data.merchantPhone = data.profile.phone;
            let cpm = await checkPaymentMethod(data);
            let gs = await masterService.getSubscription(data);
            console.log('GS ===> ', gs)
            if (cpm.responseCode == process.env.SUCCESS_RESPONSE && cpm.data[0].isAvailable == 1) {
                if (gs.responseCode == process.env.SUCCESS_RESPONSE) {
                    data.monthPlan = gs.data[0].month;
                    data.paymentAmount = parseInt(gs.data[0].price);
                    let go = await getMerchantOrderId(data);
                    console.log('getMerchantOrderId =>',go)
                    if (go.responseCode == process.env.SUCCESS_RESPONSE) {
                        data.merchantOrderId = go.data[0].id;
                        data.paymentMethodId = cpm.data[0].id;
                        data.description = gs.data[0].name;
                        data.channel = cpm.data[0].driver + '-' + cpm.data[0].code;
                        console.log('data final =>',data)
                        data.calback_url = process.env.ULTIPAGE_MERCHANT_URL+'/subscribe/callback/'+go.data[0].id
                        if(data.paymentMethod == 'GP') {
                            var goTrans = await gopayTransaction(data);
                            var gt=JSON.parse(goTrans)
                            console.log('gopayTransaction =>',gt);
                            if(gt.status_code == '201'){
                                var url = process.env.ULTIPAGE_MERCHANT_URL;
                                for(const a of gt.actions) {
                                    if(a.name == 'deeplink-redirect'){
                                        url = a.url
                                    }                                
                                }
                                data.paymentUrl = url;
                                data.referralCode = gt.transaction_id
                                let cp = await createPayment(data);
                                if (cp.responseCode == process.env.SUCCESS_RESPONSE) {

                                    //start add log
                                    logObj = {
                                        "accessor": data.profile.fullname,
                                        "accessorId": data.profile.phoneCode + '' + data.profile.phone + '_' + data.profile.deviceId,
                                        "accessorAddress": data.log.accAddress,
                                        "accessorCategory": 'merchant',
                                        'link': data.log.link,
                                        'method': data.log.method,
                                        'status': '200',
                                        'moduleName': 'Upgrade Pro Request'
                                    };
                                    dataObj = {id: cp.data[0].id, description: data.description}
                                    var activities = {
                                        category: "Ultipage Merchant",
                                        module: "Upgrade Pro Request",
                                        description: "Upgrade Pro Request, data : "+JSON.stringify(dataObj),
                                        user_id: data.profile.merchantId,
                                        user_name: data.profile.email,
                                        crud_id: cp.data[0].id
                                    }
                                    logObj.activities = activities;
                                    var l = await log.addLog(logObj);
                                    console.log('addLog =>',l)
                                    //end add log
                                    resolve({
                                        responseCode: process.env.SUCCESS_RESPONSE,
                                        responseMessage: "Success",
                                        data: {
                                            url: data.paymentUrl
                                        }
                                    })
                                } else {
                                    resolve(cp);
                                }
                            }else{
                                resolve({
                                    responseCode: process.env.NOTACCEPT_RESPONSE,
                                    responseMessage: gt.status_message
                                    // responseMessage: "Failed transaction"
                                })                            }
                        }else{
                            //duitku
                            let tr = await transactionRequest(data);
                            data.paymentUrl = tr.paymentUrl;
                            console.log('TR ===> ', tr)
                            // lanjut catat pembayaran duitKu di database payments
                            if (tr.statusCode == "00") {
                                let cp = await createPayment(data);
                                if (cp.responseCode == process.env.SUCCESS_RESPONSE) {
                                    resolve({
                                        responseCode: process.env.SUCCESS_RESPONSE,
                                        responseMessage: "Success",
                                        data: {
                                            url: data.paymentUrl
                                        }
                                    })
                                } else {
                                    resolve(cp);
                                }
                            } else {
                                console.log('Something error transaction request ultipage ==> ')
                                resolve({
                                    responseCode: process.env.NOTACCEPT_RESPONSE,
                                    responseMessage: "Failed transaction"
                                })
                            }
                        }

                    } else {
                        console.log('problem get merchant order id on transaction request ==> ')
                        resolve(go);
                    }
                } else {
                    resolve(gs);
                }
            } else {
                resolve({
                    "responseCode": process.env.NOTACCEPT_RESPONSE,
                    "responseMessage": "Invalid payment method"
                });
                return;
            }
        } catch (e) {
            console.log('Error get payment method ===> ', e)
            resolve({
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            });
            return;
        }
    })
}

async function createPayment(data) {
    try {
        if(!data.status){ data.status = 'pending'}
        if(!data.isCompleted){ data.isCompleted = 'false'}
        if(!data.referralCode){ data.referralCode = ''}
        query = 'INSERT INTO "Payments" ("subscriptionMerchantId","paymentMethodId",channel,url,amount,status,"isCompleted","isRefunded","referralCode","createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *';
        param = [data.merchantOrderId, data.paymentMethodId, data.channel, data.paymentUrl, data.paymentAmount, data.status, data.isCompleted, 'false', data.referralCode, 'NOW()'];
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: "Success",
                data: exc.rows
            })
        } else {
            return ({
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: "Failed"
            })
        }
    } catch (e) {
        console.log('Error create payment merchant ==> ', e);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

async function getMerchantOrderId(data) {
    try {
        // var mo = "'" + data.monthPlan + ' MONTH' + "'";
        var gsm = await masterService.getActiveSubscriptionMerchant(data);
        console.log('getActiveSubscriptionMerchant =>',gsm);
        if(gsm.responseCode == process.env.SUCCESS_RESPONSE) {
            // endDate accumulation
            var d = new Date();
            var now = await masterService.dateToString(d);
            var endDate = await masterService.dateToString(gsm.data[0].endDate);
            var rest = datediff(parseDate(now), parseDate(endDate))
            var startDate = d.addDays(rest);
            var endDateNew = await masterService.dateToString(startDate);

            console.log('now =>',now)
            console.log('endDate =>',endDate)
            console.log('rest =>',rest)
            console.log('data.monthPlan =>',data.monthPlan)
            console.log('startDate =>',startDate)
            console.log('endDateNew =>',endDateNew)

            query = `INSERT INTO "SubscriptionMerchants" ("subscriptionId","merchantId","startDate","endDate","isActive","createdAt") VALUES (` + data.subscriptionId + `,` + data.merchantId + `,NOW(),TO_DATE('`+ endDateNew +`','YYYY-MM-DD') + INTERVAL '` + data.monthPlan + `' MONTH,'false',NOW()) RETURNING *`;

        }else{

            query = `INSERT INTO "SubscriptionMerchants" ("subscriptionId","merchantId","startDate","endDate","isActive","createdAt") VALUES (` + data.subscriptionId + `,` + data.merchantId + `,NOW(),NOW() + INTERVAL '` + data.monthPlan + ` MONTH','false',NOW()) RETURNING *`;
        }
        console.log('query ==> ', query);
        exc = await pgCon.query(query);
        if (exc.rowCount > 0) {
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: "Success",
                data: exc.rows
            })
        } else {
            return ({
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: "Failed"
            })
        }
    } catch (e) {
        console.log('Error get merchant order id ===> ', e);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

function transactionRequest(data) {
    return new Promise(async function (resolve, reject) {
        try {
            let paramRequest = {};
            paramRequest.merchantCode = process.env.DUITKU_MERCHANT_CODE;
            paramRequest.paymentAmount = data.paymentAmount;
            paramRequest.paymentMethod = data.paymentMethod;
            paramRequest.merchantOrderId = process.env.DUITKU_ORDER_PREFIX.toString() + '/' + data.merchantOrderId + '/' + data.merchantId
            paramRequest.productDetails = "Ultipage Subscription";
            paramRequest.additionalParam = "";
            paramRequest.merchantUserInfo = "";
            paramRequest.customerVaName = data.merchantName;
            paramRequest.email = data.merchantEmail;
            paramRequest.phoneNumber = data.merchantPhoneCode + "" + data.merchantPhone;
            paramRequest.callbackUrl = process.env.DUITKU_CALLBACK_URL;
            paramRequest.returnUrl = process.env.DUITKU_RETURN_URL;
            paramRequest.signature = md5(process.env.DUITKU_MERCHANT_CODE + '' + paramRequest.merchantOrderId + '' + paramRequest.paymentAmount + '' + process.env.DUITKU_API_KEY);
            console.log('param ===> ', paramRequest)
            request.post({
                "headers": {
                    "content-type": "application/json",
                    "signature": data.signature
                },
                "url": process.env.DUITKU_BASE_URL + "/v2/inquiry",
                "body": paramRequest,
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
            console.log('Error transaction request to duitku ===> ', e);
            return ({
                responseCode: process.env.ERRORINTERNAL_RESPONSE,
                responseMessage: "Internal server error, please try again!"
            })
        }
    })
}

async function checkPaymentMethod(data) {
    try {
        query = 'SELECT * FROM "PaymentMethods" WHERE code = $1';
        param = [data.paymentMethod];
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: "Successe",
                data: exc.rows
            })
        } else {
            return ({
                responseCode: process.env.NOTOFOUND_RESPONSE,
                responseMessage: "Invalid payment method"
            })
        }
        param = []
    } catch (e) {
        console.log('Error check payment method ===> ', e);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}


exports.notificationPayment = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            console.log('Notification payment ===> ', data);
            let a = data.merchantOrderId.split('/');
            let merchantOrderId = a[1];
            let merchantId = a[2];
            data.orderIdMerchant = merchantOrderId;
            data.merchantId = data.profile.merchantId;
            if (data.resultCode == '00') {
                let usp = await updateStatusPayment(data);
                if (usp.responseCode == process.env.SUCCESS_RESPONSE) {
                    let usm = await updateSubscriptionMerchant(data);
                    resolve(usm);
                } else {
                    resolve(usp);
                }
            } else {
                resolve({
                    "responseCode": process.env.NOTACCEPT_RESPONSE,
                    "responseMessage": "Payment declined"
                });
            }
        } catch (e) {
            console.log('Error create request for transaction ===> ', e)
            resolve({
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            });
            return;
        }
    })
}

async function updateSubscriptionMerchant(data) {
    try {
        query = 'UPDATE "SubscriptionMerchants" SET isActive = $1, "updatedAt" = $2 WHERE id = $3';
        param = ['true', 'NOW()', data.orderIdMerchant];
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: "Success"
            })
        } else {
            return ({
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: "Failed"
            })
        }
    } catch (e) {
        console.log('Error update subscription merchant ==> ', e);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

async function updateStatusPayment(data) {
    try {
        let temp = '';
        let isComplete = '';
        if (data.resultCode == "00") {
            temp = "complete";
            isComplete = 'true';
        } else {
            temp = "cancel";
            isComplete = 'false';
        }
        query = 'UPDATE "Payments" SET status = $1, "isCompleted" = $2 WHERE "SubscriptionMerchantId" = $3 RETURNING *';
        param = [temp, isComplete, data.orderIdMerchant];
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: "Success"
            })
        } else {
            return ({
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: "Failed"
            })
        }
    } catch (e) {
        console.log('Error update status payment ===> ', e);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}
function parseDate(str) {
    var ymd = str.split('-');
    return new Date(ymd[0], ymd[1]-1, ymd[2]);
}
function datediff(first, second) {
    // Take the difference between the dates and divide by milliseconds per day.
    // Round to nearest whole number to deal with DST.
    return Math.round((second-first)/(1000*60*60*24));
}
async function gopayTransaction (data) {
    console.log('gopayTransaction data =>',data)
    return new Promise(async function (resolve, reject) {
        try {
            var orderId = 'order-'+new Date().getTime();
            var p = {
                "payment_type": "gopay",
                "transaction_details": {
                    "gross_amount": data.paymentAmount,
                    "order_id": orderId
                },
                "gopay": {
                    "enable_callback": true,
                    "callback_url": data.calback_url
                },
                "customer_details": {
                    "email": data.profile.email,
                    "first_name": data.profile.fullname,
                    "last_name": "",
                    "phone": data.profile.phone
                },
                "item_details": [
                    {
                        "id": "item01",
                        "price": data.paymentAmount,
                        "quantity": 1,
                        "name": data.description
                    }
                ]
            };
            console.log('ppppp =>',p)
            var auth = Buffer.from(process.env.MIDTRANS_SERVERKEY).toString("base64");
            console.log('auth =>',auth)
            console.log('yyyyyyyyyyy=>',{
                "headers": {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": auth
                },
                "url": process.env.MIDTRANS_API_URL + "/v2/charge",
                "body": JSON.stringify(p)
            })
            request.post({
                "headers": {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": auth
                },
                "url": process.env.MIDTRANS_API_URL + "/v2/charge",
                "body": JSON.stringify(p)
            }, async function (error, response, body) {
                if (error) {
                    console.log('Error Briding gopayTransaction => ', error)
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
            console.log('Error get payment method ===> ', e)
            resolve({
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            });
            return;
        }
    })
}

exports.updatePayment = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            data.merchantId = data.profile.merchantId;
            let gl = await updatePayment(data);
            console.log('updatePayment res =>',gl)
            if(gl.responseCode == process.env.SUCCESS_RESPONSE) {
                //start add log
                logObj = {
                    "accessor": data.profile.fullname,
                    "accessorId": data.profile.phoneCode + '' + data.profile.phone + '_' + data.profile.deviceId,
                    "accessorAddress": data.log.accAddress,
                    "accessorCategory": 'merchant',
                    'link': data.log.link,
                    'method': data.log.method,
                    'status': '200',
                    'moduleName': 'Upgrade Pro Payment'
                };
                dataObj = {id: gl.data[0].id, amount: gl.data[0].amount}
                var activities = {
                    category: "Ultipage Merchant",
                    module: "Upgrade Pro Payment",
                    description: "Upgrade Pro Payment, data : "+JSON.stringify(dataObj),
                    user_id: data.profile.merchantId,
                    user_name: data.profile.email,
                    crud_id: gl.data[0].id
                }
                logObj.activities = activities;
                var l = await log.addLog(logObj);
                console.log('addLog =>',l)
                //end add log
                if(gl.data) delete gl.data
            }
            resolve(gl);
        } catch (e) {
            console.log('Error get template ultipage => ', e)
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

async function updatePayment(data) {
    console.log('updatePayment =>',data)
    try {
        query = 'update "SubscriptionMerchants" set "isActive" = $1, "updatedAt" = $2 WHERE id=$3 and "merchantId" = $4 returning *';
        param = [true, 'NOW()', data.id, data.merchantId];
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
            // query = 'update "Payments" set "status" = $1, "isCompleted" = $2, "updatedAt" = $3 WHERE id=$4 and "subscriptionMerchantId" = $5 returning *';
            // param = ['success', 'true', 'NOW()', data.id, data.merchantId];
            query = 'update "Payments" set "status" = $1, "isCompleted" = $2, "updatedAt" = $3 WHERE "subscriptionMerchantId" = $4 returning *';
            param = ['success', 'true', 'NOW()', data.id];

            console.log('exc =>', {query: query, param: param})
            exc = await pgCon.query(query, param);
            console.log('exc 2',exc)
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: "Success",
                data: exc.rows
            })
        } else {
            return ({
                responseCode: process.env.NOTFOUND_RESPONSE,
                responseMessage: "Not found"
            })
        }

    } catch (e) {
        console.log('Error get link merchant ==> ', e);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}
exports.gopayTransactionRequest = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            console.log('DATA TRANSACTION REQUEST ===> ', data)
            if (!data.merchantId) {
                resolve({
                    "responseCode": process.env.NOTACCEPT_RESPONSE,
                    "responseMessage": "merchantId is required"
                });
                return;
            }
            data.id = data.merchantId;
            var gm = await masterService.getMerchant(data);
            // console.log('getMerchant =>',gm);
            if (gm.responseCode == process.env.SUCCESS_RESPONSE) {
                data.merchantName = gm.data[0].fullname;
                data.merchantEmail = gm.data[0].email;
                data.merchantPhoneCode = gm.data[0].phoneCode;
                data.merchantPhone = gm.data[0].phone;

            }else{
                resolve({
                    "responseCode": process.env.NOTFOUND_RESPONSE,
                    "responseMessage": "Merchant not found"
                });
                return;                
            }

            let cpm = await checkPaymentMethod(merchantId);
            let gs = await masterService.getSubscription(data);
            // console.log('GS ===> ', gs)
            // if (cpm.responseCode == process.env.SUCCESS_RESPONSE && cpm.data[0].isAvailable == 1) {
            //     if (gs.responseCode == process.env.SUCCESS_RESPONSE) {
            //         data.monthPlan = gs.data[0].month;
            //         data.paymentAmount = parseInt(gs.data[0].price);
            //         let go = await getMerchantOrderId(data);
            //         console.log('getMerchantOrderId =>',go)
            //         if (go.responseCode == process.env.SUCCESS_RESPONSE) {
            //             data.merchantOrderId = go.data[0].id;
            //             data.paymentMethodId = cpm.data[0].id;
            //             data.description = gs.data[0].name;
            //             data.channel = cpm.data[0].driver + '-' + cpm.data[0].code;
            //             console.log('data final =>',data)
            //             data.calback_url = process.env.ULTIPAGE_MERCHANT_URL+'/subscribe/callback/'+go.data[0].id
            //             if(data.paymentMethod == 'GP') {
            //                 var goTrans = await gopayTransaction(data);
            //                 var gt=JSON.parse(goTrans)
            //                 console.log('gopayTransaction =>',gt);
            //                 if(gt.status_code == '201'){
            //                     var url = process.env.ULTIPAGE_MERCHANT_URL;
            //                     for(const a of gt.actions) {
            //                         if(a.name == 'deeplink-redirect'){
            //                             url = a.url
            //                         }                                
            //                     }
            //                     data.paymentUrl = url;
            //                     data.referralCode = gt.transaction_id
            //                     let cp = await createPayment(data);
            //                     if (cp.responseCode == process.env.SUCCESS_RESPONSE) {

            //                         //start add log
            //                         logObj = {
            //                             "accessor": data.profile.fullname,
            //                             "accessorId": data.profile.phoneCode + '' + data.profile.phone + '_' + data.profile.deviceId,
            //                             "accessorAddress": data.log.accAddress,
            //                             "accessorCategory": 'merchant',
            //                             'link': data.log.link,
            //                             'method': data.log.method,
            //                             'status': '200',
            //                             'moduleName': 'Upgrade Pro Request'
            //                         };
            //                         dataObj = {id: cp.data[0].id, description: data.description}
            //                         var activities = {
            //                             category: "Ultipage Merchant",
            //                             module: "Upgrade Pro Request",
            //                             description: "Upgrade Pro Request, data : "+JSON.stringify(dataObj),
            //                             user_id: data.profile.merchantId,
            //                             user_name: data.profile.email,
            //                             crud_id: cp.data[0].id
            //                         }
            //                         logObj.activities = activities;
            //                         var l = await log.addLog(logObj);
            //                         console.log('addLog =>',l)
            //                         //end add log
            //                         resolve({
            //                             responseCode: process.env.SUCCESS_RESPONSE,
            //                             responseMessage: "Success",
            //                             data: {
            //                                 url: data.paymentUrl
            //                             }
            //                         })
            //                     } else {
            //                         resolve(cp);
            //                     }
            //                 }else{
            //                     resolve({
            //                         responseCode: process.env.NOTACCEPT_RESPONSE,
            //                         responseMessage: gs.status_message
            //                         // responseMessage: "Failed transaction"
            //                     })                            }
            //             }else{
            //                 //duitku
            //                 let tr = await transactionRequest(data);
            //                 data.paymentUrl = tr.paymentUrl;
            //                 console.log('TR ===> ', tr)
            //                 // lanjut catat pembayaran duitKu di database payments
            //                 if (tr.statusCode == "00") {
            //                     let cp = await createPayment(data);
            //                     if (cp.responseCode == process.env.SUCCESS_RESPONSE) {
            //                         resolve({
            //                             responseCode: process.env.SUCCESS_RESPONSE,
            //                             responseMessage: "Success",
            //                             data: {
            //                                 url: data.paymentUrl
            //                             }
            //                         })
            //                     } else {
            //                         resolve(cp);
            //                     }
            //                 } else {
            //                     console.log('Something error transaction request ultipage ==> ')
            //                     resolve({
            //                         responseCode: process.env.NOTACCEPT_RESPONSE,
            //                         responseMessage: "Failed transaction"
            //                     })
            //                 }
            //             }

            //         } else {
            //             console.log('problem get merchant order id on transaction request ==> ')
            //             resolve(go);
            //         }
            //     } else {
            //         resolve(gs);
            //     }
            // } else {
            //     resolve({
            //         "responseCode": process.env.NOTACCEPT_RESPONSE,
            //         "responseMessage": "Invalid payment method"
            //     });
            //     return;
            // }
        } catch (e) {
            console.log('Error get payment method ===> ', e)
            resolve({
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            });
            return;
        }
    })
}