require('dotenv').config();
const request = require('request');
var mongoose = require('mongoose').set('debug', true);
var mongo = require('../config/mongo');
var accountSchema = require('../config/accountSchema');
var authService = require('../service/authService');
var masterService = require('../service/masterService');
const pgCon = require('../config/pgConfig');
let message = {};
const asim = require('../config/asymmetric');
const notification = require('../config/notification');
const fs = require('fs');
let AWS = require('aws-sdk');
const pub = fs.readFileSync('./publicKey.key', 'utf8');
const aes_key = process.env.AES_KEY_SERVER;
const aes_iv = process.env.AES_IV_SERVER;
// let decode = require('im-decode');
const log = require('../config/log');
const argon2 = require('argon2');
var logObj = {}, dataObj = {};
var query = '';
var param = '';
var exc = '';

process.env.ULTIPAGE_COMPROF_URL
process.env.ULTIPAGE_MERCHANT_PUBLIC_IMG_PATH
process.env.ULTIPAGE_SUPPORT_EMAIL

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

exports.getTemplate = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            console.log('data get template => ', data);
            request.get({
                "headers": {
                    "content-type": "application/json"
                },
                "json": true,
                "url": process.env.CDNSOURCE_HOST + "/source/getSource/template_ultipage?flowEntry='ultipage'"
            }, async function (error, response, body) {
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
            console.log('Error get template ultipage => ', e)
            notification.sendErrorNotification(e.stack);
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

exports.postPage = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            data.merchantId = data.profile.merchantId;
            // console.log('POST PAGE DATA =======> ', data)
            //check count page max 2 of merchant
            if (!data.pageId) {
                let cp = await checkCountPage(data);
                if (cp.responseCode == process.env.SUCCESS_RESPONSE) {
                    if (parseInt(cp.data[0].count) >= 2) {
                        resolve({
                            responseCode: process.env.NOTACCEPT_RESPONSE,
                            responseMessage: "Your page has been reached limit"
                        })
                        return;
                    }
                } else {
                    resolve(cp);
                }
            }

            // check if page id and have image upload
            if (data.pageId) {
                var timeToString = Date.now();
                // console.log('Date.now() =>',timeToString);
                // if (data.pageImg) {
                //     data.scope = "ultipage";
                //     data.behalf = "page";
                //     data.img = data.pageImg;
                //     data.ownerId = data.pageId + '-' + timeToString;
                //     let up = await masterService.uploadImage(data);
                //     if (up.responseCode == process.env.SUCCESS_RESPONSE) {
                //         data.pageImgPath = up.data[0].path;
                //         data.pageImgType = up.data[0].imgType;
                //         data.pageImgOrigin = up.data[0].imgOrigin;
                //         data.pageModelType = 'page';
                //     } else {
                //         resolve(up);
                //         return;
                //     }
                // } else {
                //     data.filterPageImg = "no";
                // }

                // if (data.bannerImg) {
                //     var timeToString = Date.now();
                //     data.scope = "ultipage";
                //     data.behalf = "banner";
                //     data.img = data.pageImg;
                //     data.ownerId = data.pageId + '-' + timeToString;
                //     data.img = data.bannerImg;
                //     let up = await masterService.uploadImage(data);
                //     if (up.responseCode == process.env.SUCCESS_RESPONSE) {
                //         data.bannerImgPath = up.data[0].path;
                //         data.bannerImgType = up.data[0].imgType;
                //         data.bannerImgOrigin = up.data[0].imgOrigin;
                //         data.bannerModelType = 'banner';
                //     } else {
                //         resolve(up);
                //         return;
                //     }
                // } else {
                //     data.filterBannerImg = "no";
                // }
                data.filterBannerImg = "no";
                data.filterPageImg = "no";
            }
            console.log('bannerImgPath 1 =>',data.bannerImgPath)

            if (data.pageId) {
                let ut = await updateMerchantPageData(data);
                if (ut.responseCode == process.env.SUCCESS_RESPONSE) {
                    //start add log
                    logObj = {
                        "accessor": data.profile.fullname,
                        "accessorId": data.profile.phoneCode + '' + data.profile.phone + '_' + data.profile.deviceId,
                        "accessorAddress": data.log.accAddress,
                        "accessorCategory": 'merchant',
                        'link': data.log.link,
                        'method': data.log.method,
                        'status': '200',
                        'moduleName': 'Update Page Merchant'
                    };
                    dataObj = {id: data.pageId, name: data.pageName}
                    var activities = {
                        category: "Ultipage Merchant",
                        module: "Update Page",
                        description: "Update Page, data : "+JSON.stringify(dataObj),
                        user_id: data.profile.merchantId,
                        user_name: data.profile.email,
                        crud_id: data.pageId
                    }
                    logObj.activities = activities;
                    var l = await log.addLog(logObj);
                    console.log('addLog =>',l)
                    //end add log
                    let us = await updateThemePages(data);
                    if (us.responseCode == process.env.SUCCESS_RESPONSE) {
                        let find = await masterService.getPage(data);
                        resolve(find);
                    } else {
                        resolve(us);
                    }
                } else {
                    resolve(ut);
                }
            } else {
                let st = await saveThemePages(data);
                if (st.responseCode == process.env.SUCCESS_RESPONSE) {
                    // insert media
                    data.modelId = data.merchantId;
                    if (data.pageImg) {
                        data.modelType = "merchantPage";
                        data.imgPath = data.pageImgPath;
                        data.imgOrigin = data.pageImgOrigin;
                        data.imgType = data.pageModelType;
                        let ins = await insertMedia(data);
                    } else {
                        data.modelType = "merchantPage";
                        data.imgPath = process.env.DEFAULT_IMAGE;
                        data.imgOrigin = process.env.DEFAULT_IMAGE_ORIGIN;
                        data.imgType = 'image/jpeg';
                        let ins = await insertMedia(data);
                    }

                    if (data.bannerImg) {
                        data.modelType = "merchantBanner";
                        data.imgPath = data.bannerImgPath;
                        data.imgOrigin = data.bannerImgOrigin;
                        data.imgType = data.bannerImgType;
                        let ins = await insertMedia(data);
                    } else {
                        data.modelType = "merchantPage";
                        data.imgPath = process.env.DEFAULT_BANNER;
                        data.imgOrigin = process.env.DEFAULT_IMAGE_ORIGIN;
                        data.imgType = 'image/jpeg';
                        let ins = await insertMedia(data);
                    }

                    //start add log
                    logObj = {
                        "accessor": data.profile.fullname,
                        "accessorId": data.profile.phoneCode + '' + data.profile.phone + '_' + data.profile.deviceId,
                        "accessorAddress": data.log.accAddress,
                        "accessorCategory": 'merchant',
                        'link': data.log.link,
                        'method': data.log.method,
                        'status': '200',
                        'moduleName': 'Create Page Merchant'
                    };
                    dataObj = {id: st.data[0].id, name: st.data[0].name}
                    var activities = {
                        category: "Ultipage Merchant",
                        module: "Create Page",
                        description: "Create Page, data : "+JSON.stringify(dataObj),
                        user_id: data.profile.merchantId,
                        user_name: data.profile.email,
                        crud_id: st.data[0].id
                    }
                    logObj.activities = activities;
                    var l = await log.addLog(logObj);
                    console.log('addLog =>',l)
                    //end add log                    

                    let upp = await updateMerchantPageData(data);
                    if (upp.responseCode == process.env.SUCCESS_RESPONSE) {
                        data.pageId = st.data[0].id;
                        let gp = await masterService.getPage(data);
                        resolve(gp);
                    } else {
                        resolve(upp);
                    }
                } else {
                    resolve(st);
                    return;
                }
            }
        } catch (e) {
            notification.sendErrorNotification(e.stack);
            console.log('Error get template ultipage => ', e)
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

async function updateThemePages(data) {
    try {
        // var pageHtml = data.pageHtml;
        // var gmbi = await getMerchantById(data.profile.merchantId);
        // console.log('gmbi =>',gmbi)
        // if(gmbi.responseCode == process.env.SUCCESS_RESPONSE) {
        //     pageHtml = data.pageHtml;
        //     if(gmbi.data[0].bannerImageUrl != process.env.DEFAULT_BANNER) {
        //         pageHtml = pageHtml.replace(process.env.DEFAULT_BANNER, gmbi.data[0].bannerImageUrl)
        //         data.pageHtml = pageHtml;
        //     }
        //     pageHtml = data.pageHtml;
        //     if(gmbi.data[0].imageUrl != process.env.DEFAULT_IMAGE) {
        //         pageHtml = pageHtml.replace(process.env.DEFAULT_IMAGE, gmbi.data[0].imageUrl)
        //         data.pageHtml = pageHtml;
        //     }
        // }

        // update other pages
        query = 'UPDATE "ThemePages" SET name = $1 ,title = $2 WHERE "merchantId" = $3 RETURNING *';
        param = [data.pageName, data.pageTitle, data.profile.merchantId];
        await pgCon.query(query, param);

        query = 'UPDATE "ThemePages" SET name = $1 , content = $2, "templateName" = $3, title = $4 WHERE id = $5 RETURNING *';
        param = [data.pageName, data.pageHtml, data.templateName, data.pageTitle, data.pageId];
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
        console.log('Error update theme pages ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}
async function getMerchantById(id) {
    try {
        
        query = 'select * from "Merchants"  WHERE id = $1';
        param = [id];
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
        console.log('Error getMerchantById ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}
async function getMerchantLinkById(id) {
    try {
        
        query = 'select * from "MerchantLinks"  WHERE "merchantId" = $1';
        param = [id];
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
        console.log('Error getMerchantLinkById ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}
async function getProductById(id) {
    try {
        
        query = 'select * from "Products"  WHERE "merchantId" = $1';
        param = [id];
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
        console.log('Error getProductById ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}
async function checkCountPage(data) {
    try {
        query = 'SELECT count(id) as count FROM "ThemePages" WHERE "merchantId" = $1';
        param = [data.merchantId];
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
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
        notification.sendErrorNotification(e.stack);
        console.log('Error check count page ==> ', e);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

async function updateMerchantPageData(data) {
    // console.log('updateMerchantPageData =>',data)
    try {
        if (!data.pageImgPath) {
            data.pageImgPath = process.env.DEFAULT_IMAGE;
        }
        if (!data.bannerImgPath) {
            data.bannerImgPath = process.env.DEFAULT_BANNER;
        }
        var gmbi = await getMerchantById(data.profile.merchantId);
        if(gmbi.responseCode == process.env.SUCCESS_RESPONSE) {
            if(data.pageName == '') {
                data.pageName = gmbi.data[0].name;
            }
            if(data.pageDescription == '') {
                data.pageDescription = gmbi.data[0].description;
            }
            if(data.pageImgPath == process.env.DEFAULT_IMAGE) {
                data.pageImgPath = gmbi.data[0].imageUrl;
            }
            if(data.bannerImgPath == process.env.DEFAULT_BANNER) {
                data.bannerImgPath = gmbi.data[0].bannerImageUrl;
            }
        }

        query = 'UPDATE "Merchants" SET "imageUrl" = $1 , description = $2 , "bannerImageUrl" = $3 , "productTitle" = $4 , "updatedAt" = $5 WHERE "id" = $6 returning id';
        param = [data.pageImgPath, data.pageDescription, data.bannerImgPath, data.catalogue, 'NOW()', data.merchantId];
        if (data.filterPageImg) {
            query = 'UPDATE "Merchants" SET description = $1 , "bannerImageUrl" = $2 , "productTitle" = $3 , "updatedAt" = $4 WHERE "id" = $5 returning id';
            param = [data.pageDescription, data.bannerImgPath, data.catalogue, 'NOW()', data.merchantId];
        }

        if (data.filterBannerImg) {
            query = 'UPDATE "Merchants" SET "imageUrl" = $1 , description = $2 , "productTitle" = $3 , "updatedAt" = $4 WHERE "id" = $5 returning id';
            param = [data.pageImgPath, data.pageDescription, data.catalogue, 'NOW()', data.merchantId];
        }

        if (data.filterBannerImg && data.filterPageImg) {
            query = 'UPDATE "Merchants" SET description = $1 , "productTitle" = $2 , "updatedAt" = $3 WHERE "id" = $4 returning id';
            param = [data.pageDescription, data.catalogue, 'NOW()', data.merchantId];
        }
        console.log('updateMerchantPageData =>', {
            query: query,
            param: param

        })
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
        console.log('Error update merchant page data ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

async function saveThemePages(data) {
    try {
        var gmbi = await getMerchantById(data.profile.merchantId);
        if(gmbi.responseCode == process.env.SUCCESS_RESPONSE) {
            var query='update "Merchants" set '
            if(gmbi.data[0].imageUrl == '' || gmbi.data[0].imageUrl == null) {
                query += ` "imageUrl" ='`+process.env.DEFAULT_IMAGE+`',`; 
            }
            if(gmbi.data[0].bannerImageUrl == '' || gmbi.data[0].bannerImageUrl == null) {
                query += ` "bannerImageUrl" = '`+process.env.DEFAULT_BANNER+`',`;
            }
            query += `"updatedAt" = Now() where id=`+data.merchantId
            exc = await pgCon.query(query);
        }
        query = 'select * from "ThemePages" WHERE "merchantId" = $1';
        param = [data.merchantId];
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
            if(data.pageName == '') {
                data.pageName = exc.rows[0].name;
            }
            if(data.pageTitle == '') {
                data.pageTitle = exc.rows[0].title;
            }
        }

        query = 'INSERT INTO "ThemePages" ("merchantId",name,content,"createdAt","templateName",title) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *';
        param = [data.merchantId, data.pageName, data.pageHtml, 'NOW()', data.templateName, data.pageTitle];
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
        console.log('Error save theme pages ==> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

exports.getPage = function (data) {
    // console.log('getPage data=>',data)
    return new Promise(async function (resolve, reject) {
        try {
            data.merchantId = data.profile.merchantId;
            let gpm = await getPageMerchant(data);
            console.log('getPageMerchant =>',gpm.responseCode)
            let gpp = await getProduct(data);
            let gpl = await getLink(data);
            if (gpm.responseCode == process.env.SUCCESS_RESPONSE) {
                if (gpp.responseCode == process.env.SUCCESS_RESPONSE) {
                    for (let i = 0; i < gpm.data.length; i++) {
                        gpm.data[i].product = gpp.data;
                    }
                }
                if (gpl.responseCode == process.env.SUCCESS_RESPONSE) {
                    for (let i = 0; i < gpm.data.length; i++) {
                        gpm.data[i].link = gpl.data;
                    }
                }
                resolve(gpm);
            } else {
                resolve(gpm);
            }
        } catch (e) {
            console.log('Error get template ultipage => ', e)
            notification.sendErrorNotification(e.stack);
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

async function getLink(data) {
    try {
        query = 'SELECT * FROM "MerchantLinks" WHERE "merchantId" = $1';
        param = [data.merchantId];
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
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
        console.log('Error get link ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

async function getProduct(data) {
    try {
        query = 'SELECT * FROM "Products" WHERE "merchantId" = $1';
        param = [data.merchantId];
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
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
        console.log('Error get product ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

async function getPageMerchant(data) {
    // console.log('getPageMerchant data =>',data)
    try {
        if (data.pageId) {
            query = `SELECT tp.id,tp.name,tp.content,tp."isPublish", tp."templateName", tp."createdAt",m.description,m."bannerImageUrl", m."imageUrl", m."productTitle" as catalogue,title, m."canOrder", m."urlName", replace(m."whatsappNumber",'+62','0') as "whatsappNumber" FROM "ThemePages" tp JOIN "Merchants" m ON m.id = tp."merchantId" WHERE "merchantId" = $1 AND tp.id = $2`;
            param = [data.merchantId, data.pageId];
        } else {
            query = `SELECT tp.id,tp.name,tp.content,tp."isPublish", tp."templateName", tp."createdAt",m.description,m."bannerImageUrl", m."imageUrl", m."productTitle" as catalogue,title, m."canOrder", m."urlName", replace(m."whatsappNumber",'+62','0') as "whatsappNumber" FROM "ThemePages" tp JOIN "Merchants" m ON m.id = tp."merchantId" WHERE "merchantId" = $1`;
            param = [data.merchantId];
        }
        console.log('query =>',query, 'param =>',param)
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: 'Success',
                data: exc.rows
            })
        } else {
            return ({
                responseCode: process.env.NOTFOUND_RESPONSE,
                responseMessage: 'Not found'
            })
        }
    } catch (e) {
        console.log('Error get page merchant ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: 'Internal server error, please try again!'
        })
    }
}

exports.deletePage = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            data.merchantId = data.profile.merchantId;
            let dpm = await deletePageMerchant(data);
            if(dpm.responseCode == process.env.SUCCESS_RESPONSE){
                //start add log
                logObj = {
                    "accessor": data.profile.fullname,
                    "accessorId": data.profile.phoneCode + '' + data.profile.phone + '_' + data.profile.deviceId,
                    "accessorAddress": data.log.accAddress,
                    "accessorCategory": 'merchant',
                    'link': data.log.link,
                    'method': data.log.method,
                    'status': '200',
                    'moduleName': 'Delete Page Merchant'
                };
                dataObj = {id: dpm.data[0].id, name: dpm.data[0].name}
                var activities = {
                    category: "Ultipage Merchant",
                    module: "Delete Page",
                    description: "Delete Page, data : "+JSON.stringify(dataObj),
                    user_id: data.profile.merchantId,
                    user_name: data.profile.email,
                    crud_id: dpm.data[0].id
                }
                logObj.activities = activities;
                var l = await log.addLog(logObj);
                console.log('addLog =>',l)
                //end add log            
                if(dpm.data) delete dpm.data;
            }
            resolve(dpm);
        } catch (e) {
            console.log('Error get template ultipage => ', e)
            notification.sendErrorNotification(e.stack);
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

async function deletePageMerchant(data) {
    try {
        query = 'DELETE FROM "ThemePages" WHERE id = $1 and "merchantId"=$2 returning *';
        param = [data.pageId, data.profile.merchantId];
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
        console.log('Error delete page merchant ====> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

exports.publishPage = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            data.merchantId = data.profile.merchantId;
            if (data.isPublish != "0" && data.isPublish != "1") {
                resolve({
                    responseCode: process.env.NOTACCEPT_RESPONSE,
                    responseMessage: "Invalid publish parameter"
                })
                return;
            }
            if (data.isPublish == "1") {
                let cpp = await checkPublishPage(data);
                if (cpp.responseCode == process.env.SUCCESS_RESPONSE) {
                    resolve({
                        responseCode: process.env.NOTACCEPT_RESPONSE,
                        responseMessage: "You already published page before"
                    })
                    return;
                }
            }

            let ppm = await publishPageMerchant(data);
            if(ppm.responseCode == process.env.SUCCESS_RESPONSE) {
                //start add log
                logObj = {
                    "accessor": data.profile.fullname,
                    "accessorId": data.profile.phoneCode + '' + data.profile.phone + '_' + data.profile.deviceId,
                    "accessorAddress": data.log.accAddress,
                    "accessorCategory": 'merchant',
                    'link': data.log.link,
                    'method': data.log.method,
                    'status': '200',
                    'moduleName': 'Publish Page Merchant'
                };
                dataObj = {id: ppm.data[0].id, name: ppm.data[0].name}
                var activities = {
                    category: "Ultipage Merchant",
                    module: "Publish Page",
                    description: "Publish Page, data : "+JSON.stringify(dataObj),
                    user_id: data.profile.merchantId,
                    user_name: data.profile.email,
                    crud_id: ppm.data[0].id
                }
                if(ppm.data[0].isPublish == false){ // unpublish
                    logObj.moduleName = 'Unpublish Page Merchant';
                    activities.description = "Unpublish Page, data : "+JSON.stringify(dataObj);
                    activities.module = "Unpublish Page"
                }

                logObj.activities = activities;
                var l = await log.addLog(logObj);
                console.log('addLog =>',l)
                //end add log             
                if(ppm.data) delete ppm.data   
            }
            resolve(ppm);
        } catch (e) {
            console.log('Error publishPage', e)
            notification.sendErrorNotification(e.stack);
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

async function checkPublishPage(data) {
    try {
        query = 'SELECT * FROM "ThemePages" WHERE "merchantId" = $1 AND "isPublish" = $2';
        param = [data.merchantId, 'true'];
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
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
        console.log('Error check publish page ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

async function publishPageMerchant(data) {
    try {
        query = 'UPDATE "ThemePages" SET "isPublish" = $1 WHERE id = $2 returning *';
        param = [data.isPublish, data.pageId];
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
        console.log('error publishPageMerchant =>',e)
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

function randomString() {
    var chars = "0123456789";
    var string_length = 5;
    var randomstring = '';
    for (var i = 0; i < string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum, rnum + 1);
    }
    return randomstring;
}

exports.getProfile = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            console.log('data =>',data)
            if(data) { data = JSON.parse(data) };
            console.log('data =>',data)
            console.log('data =>',data.email)

            let gpm = await getProfileAccount(data);
            
            resolve(gpm);
        } catch (e) {
            console.log('Error get template ultipage => ', e)
            notification.sendErrorNotification(e.stack);
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

exports.getActiveSubscriptionMerchant = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            let gs = await getActiveSubscriptionMerchant(data);
            resolve(gs);
        } catch (e) {
            console.log('Error getActiveSubscriptionMerchant => ', e)
            notification.sendErrorNotification(e.stack);
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}
async function getActiveSubscriptionMerchant(data) {
    try {
        query = 'SELECT sm."isActive", sm."endDate", s.name as "subscriptionPlane" FROM "SubscriptionMerchants" sm, "Subscriptions" s WHERE sm."subscriptionId"= s.id and sm."merchantId" = $1 AND sm."isActive" = $2 order by sm.id desc limit 1';
        param = [data.merchantId, 'true'];
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
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
        console.log('get active subscription merchant ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

async function getProfileAccount(data) {
    console.log('getProfileAccount data=>', data)
    try {
        // open connection for find data by phone in ultipage
        mongoose.Promise = global.Promise;
        await mongoose.connect(mongo.mongoDb.url, {
            useNewUrlParser: true
        });
        let query = await accountSchema.findOne({
            "email": data.email
        });
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
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: 'Internal server error, please try again!'
        })
    }
}

function updateProfileAccountData(data) {
    return new Promise(async function (resolve, reject) {
        try {
            console.log('DATA => ', data)
            data.apiService = process.env.SERVICE_CODE;
            request.put({
                "headers": {
                    "content-type": "application/json",
                    "apiService": data.apiService,
                    "token": '',
                    "signature": '',
                    'secretKey': '',
                    'clientKey': '',
                    'aes': ''
                },
                "body": data,
                "url": process.env.ACCOUNT_SERVICE_LOCAL_HOST + "/account/profile/partner",
                "json": true,
            }, async function (error, response, body) {
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
            console.log('Error update profile account data ===> ', e);
            notification.sendErrorNotification(e.stack);
            resolve({
                responseCode: process.env.ERRORINTERNAL_RESPONSE,
                responseMessage: 'Internal server error, please try again!'
            })
        }
    })
}

exports.updateProfile = function (data) {
    console.log('updateProfile data =>', data)
    return new Promise(async function (resolve, reject) {
        try {
            //delete null value, bcoz encrypt
            if(data.filter == 'change_phone') { 
                if(data.oldEmail == 'null') {
                    delete data.oldEmail;
                }
                if(data.email == 'null') {
                    delete data.email;
                }
            }else if(data.filter == 'change_email') { 
                if(data.oldPhone == 'null') {
                    delete data.oldPhone;
                }
            }

            if (!data.fullname && !data.phone && !data.phoneCode && !data.email && !data.whatsappNumber && !data.language) {
                resolve({
                    responseCode: process.env.NOTACCEPT_RESPONSE,
                    responseMessage: "Please input at least 1 parameter for update profile"
                })
                return;
            }
            if (data.phone && !data.phoneCode || data.phoneCode && !data.phone) {
                resolve({
                    responseCode: process.env.NOTACCEPT_RESPONSE,
                    responseMessage: "Phone and code required"
                })
                return;
            }

            let change = '';
            if (data.fullname) {
                change = "name"
            } else if (data.phone && data.phoneCode) {
                change = "phone"
            } else if (data.email) {
                change = "email"
            } else if (data.language) {
                change = "language"
            }
            if(data.filter == 'change_email') change = "email"
            console.log('change =>', change)
            switch (change) {
                case "name":
                    let upm = await updateProfileMongo(data);
                    resolve(upm);
                    break;
                case "phone":
                    if (!data.oldPhone) {
                        resolve({
                            responseCode: process.env.NOTACCEPT_RESPONSE,
                            responseMessage: "Old phone required"
                        })
                        return;
                    }
                    if (!data.phone) {
                        resolve({
                            responseCode: process.env.NOTACCEPT_RESPONSE,
                            responseMessage: "Phone required"
                        })
                        return;
                    }
                    let fpm = await findProfileMongo(data);
                    console.log('findProfileMongo ==> ', fpm)
                    if (fpm.responseCode == process.env.SUCCESS_RESPONSE) {
                        data.password = fpm.data.originPassword
                        let upm = await updateProfileMongo(data);
                        console.log('updateProfileMongo ==> ', upm)
                        resolve(upm);
                    } else {
                        resolve(fpm);
                        return;
                    }


                    
                    break;
                case "email":
                    if (data.filter == "change_email") {
                        let fpm = await findProfileMongo(data);
                        console.log('findProfileMongo ==> ', fpm)
                        if (fpm.responseCode == process.env.SUCCESS_RESPONSE) {
                            let upm = await updateProfileMongo(data);
                            resolve(upm);
                            return;
                        } else {
                            resolve(upm);
                            return;
                        }


                    }else{
                        let cd = await authService.checkAccountUltipage({phoneCode: data.phoneCode, phone: data.phone});
                        console.log('check regist account => ', cd);
                        if (cd.responseCode == process.env.NOTFOUND_RESPONSE) {
                            // request otp for change phone
                            console.log('DATA UNTUK SEND OTP ===> ', data)
                            let otpCode = await generateOtp();
                            if(data.phone=='85655695000') { otpCode='123456' }//for account testing
                            let dd = {
                                confirmationCode: otpCode,
                                phone: data.profile.phone,
                                phoneCode: data.profile.phoneCode,
                                deviceId: data.deviceId,
                            }
                            let otp = await authService.saveUltipageOtp(dd);
                            console.log('OTP ===> ', otp)

                            let html = '<div style="width:100%; margin:0 auto">' +
                                '<div style="width:100%; background:#144371; padding:15px; text-align:center">' +
                                '<img src="https://d24xkw9p26rh4b.cloudfront.net/Ks7shssJiJjtW8yw25S5sSPVpWCbSoOa7ngeGrAPzMI%3D.jpeg" />' +
                                '</div>' +
                                '<h1>Request OTP Code</h1>' +
                                '<div style="width:100%; background:#fff; text-align:left">' +
                                '<p>Hello ' + data.profile.fullname + ',</p>' +
                                '<p>Thank You for using Ultipage. This is an Authorization Code regarding your request.</p>' +
                                '<p><b>' + otp.data.otpCode + '</b></p>' +
                                '</div>' +
                                '</div>' + emailFooter
                            let p = {
                                fullname: data.profile.fullname,
                                // email: data.profile.email,
                                email: data.email,
                                phoneCode: otp.data.phoneCode,
                                phone: otp.data.phone,
                                otpCode: otp.data.otpCode,
                                html: JSON.stringify(html),
                            }
                            console.log('pppppp ===> ', p)
                            if(data.phone=='85655695000') { //for account testing
                            }else{
                                let so = await authService.otpSend(p);
                                console.log('otpSend ppp ===> ', so)
                            }

                            if (otp) {
                                resolve({
                                    responseCode: process.env.SUCCESS_RESPONSE,
                                    responseMessage: "Success, confirm your OTP please"
                                })
                                return;
                            } else {
                                resolve({
                                    responseCode: process.env.NOTACCEPT_RESPONSE,
                                    responseMessage: "Failed"
                                })
                                return;
                            }                            
                        }else{
                            resolve(cd); 
                            return;

                        }

                        // let cd = await authService.checkAccountUltipage({email: data.email});
                        // console.log('check regist account => ', cd);
                        // if (cd.responseCode == process.env.NOTFOUND_RESPONSE) {
                        // }else{
    
                        // }
                        // resolve(cd);
                        // return
    
                    }

                    break;
                case "language":
                    let upfm = await updateProfileMongo(data); 
                    resolve(upfm);
                    break;
    
            }

            // update profil on merchant

            // update account in central mongo
            // let upm = await updateProfileMongo(data);
            // console.log('UPM ===> ', upm)
            // let acc = {
            //     apiService: process.env.SERVICE_CODE,
            //     account_id: data.profile.accountId,
            //     account_category: "partner",
            //     merchant_id: data.profile.merchantId,
            //     profile: {
            //         phoneCode: data.profile.phoneCode,
            //         phone: data.profile.phone,
            //         deviceId: data.profile.deviceId,
            //         email: data.profile.email,
            //         employee_id: data.profile.accountId,
            //         accountCategory: "partner"
            //     }
            // }
            // if (data.fullname) {
            //     acc.name = data.fullname;
            // }
            // if (data.email) {
            //     acc.email = data.email;
            //     acc.old_email = data.profile.email
            // }

            // // update profil on central data account
            // let upc = await updateProfileAccountData(acc);
            // console.log('upc ==> ', upc)

            // let gpm = await updateProfileMerchant(data);
            // if (data.phone && data.phoneCode) {
            //     console.log('masuk')
            //     if (!data.deviceId) {
            //         resolve({
            //             responseCode: process.env.NOTACCEPT_RESPONSE,
            //             responseMessage: "Device ID Required"
            //         })
            //         return;
            //     }
            //     if (data.filter == "confirm_change_phone") {

            //     } else {
            //         let otpCode = await generateOtp();
            //         let dd = {
            //             confirmationCode: otpCode,
            //             phone: data.phone,
            //             phoneCode: data.phoneCode,
            //             deviceId: data.deviceId,

            //         }
            //         console.log('yuhu ==> ', dd)
            //         let otp = await authService.saveUltipageOtp(dd);
            //         console.log('OTP ===> ', otp)
            //         if (otp) {
            //             resolve({
            //                 responseCode: process.env.SUCCESS_RESPONSE,
            //                 responseMessage: "Success"
            //             })
            //         } else {
            //             resolve({
            //                 responseCode: process.env.NOTACCEPT_RESPONSE,
            //                 responseMessage: "Failed"
            //             })
            //         }
            //     }
            // }

        } catch (e) {
            console.log('Error updateProfile => ', e);
            notification.sendErrorNotification(e.stack);            
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

async function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function updateProfileMongo(data) {
    let newValues = {};
    try {
        console.log('data ===> ', data)
        let whereValues = {};
        if (data.fullname) {
            newValues.fullname = data.fullname
        }
        if (data.email) {
            newValues.email = data.email
        }
        if (data.language) {
            newValues.language = data.language
        }
        if(data.filter == 'change_phone') {
            var password = await argon2.hash(data.phone + ':' + data.password);
            newValues.phone = data.phone;
            newValues.password = password;
            whereValues.phone = data.oldPhone;
        }else if(data.filter == 'change_email') {
            newValues.email = data.email;
            whereValues.email = data.oldEmail;
        }
        let sorting = {
            "createdDate": "-1"
        };
        console.log('wherevalues ==> ', whereValues)
        console.log('newvalues ==> ', newValues)
        mongoose.Promise = global.Promise;
        await mongoose.connect(mongo.mongoDb.url);
        let tc = await accountSchema.findOneAndUpdate(whereValues, {
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
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: "Failed"
            })
        }
    } catch (e) {
        console.log('Error update profile mongoo ==> ', e)
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

async function findProfileMongo(data) {
    try {
        console.log('data ===> ', data)
        if (data.profile && data.profile.merchantId) {
            data.merchantId = data.profile.merchantId
        }
        let whereValues = {
            merchantId: data.merchantId
        };
        if(data.filter == 'change_phone') {
            delete whereValues.merchantId;
            whereValues.phone = data.oldPhone;
        }else if(data.filter == 'change_email') {
            delete whereValues.merchantId;
            whereValues.email = data.oldEmail;
        }
        console.log('wherevalues ==> ', whereValues)
        mongoose.Promise = global.Promise;
        await mongoose.connect(mongo.mongoDb.url);
        let tc = await accountSchema.findOne(whereValues);
        if (tc) {
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: "Success",
                data: tc
            })
        } else {
            return ({
                responseCode: process.env.NOTFOUND_RESPONSE,
                responseMessage: "Not Found"
            })
        }
    } catch (e) {
        console.log('Error update profile mongoo ==> ', e)
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

exports.getSubscription = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            let gs = await getSubscription(data);
            resolve(gs);
        } catch (e) {
            console.log('Error get template ultipage => ', e)
            notification.sendErrorNotification(e.stack);
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

async function getSubscription(data) {
    try {
        if (data.subscriptionId) {
            query = 'SELECT price / month as "pricePerMonth",st.*,s.*,st.name as subscriptiontypename,st.id as substypeid FROM "Subscriptions" s JOIN "SubscriptionTypes" st ON st.id = s."subscriptionTypeId" WHERE s.id = $1 ORDER BY s.id';
            param = [data.subscriptionId];
        } else {
            query = 'SELECT price / month as "pricePerMonth",st.*,s.*,st.name as subscriptiontypename,st.id as substypeid FROM "Subscriptions" s JOIN "SubscriptionTypes" st ON st.id = s."subscriptionTypeId" ORDER BY s.id';
            param = [];
        }
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: "Success",
                data: exc.rows
            })
        } else {
            return ({
                responseCode: process.env.NOTFOUND_RESPONSE,
                responseMessage: "Not Found"
            })
        }
    } catch (e) {
        console.log('Error get subscription ===> ', e)
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

exports.switchItem = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            // belum pengecekan PRO / BASIC
            data.merchantId = data.profile.merchantId;
            if (data.switch != "on" && data.switch != "off") {
                resolve({
                    responseCode: process.env.NOTACCEPT_RESPONSE,
                    responseMessage: "Invalid switch"
                })
                return;
            }
            switch (data.category) {
                case "cart":
                    let gs = await switchCart(data);
                    resolve(gs);
                case "seo":
                    let gss = await switchSEO(data);
                    resolve(gss);
                default:
                    message = {
                        "responseCode": process.env.NOTACCEPT_RESPONSE,
                        "responseMessage": "Invalid access"
                    }
                    resolve(message);
                    return;
            }
        } catch (e) {
            console.log('Error get template ultipage => ', e)
            notification.sendErrorNotification(e.stack);
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
            return;
        }
    })
}

async function switchSEO(data) {
    try {
        if (data.switch == "on") {
            query = 'UPDATE "Seo" SET "isActive" = true,"updatedAt" = $1 WHERE "merchantId" = $2 returning *';
            param = ['NOW()', data.merchantId];
        } else {
            query = 'UPDATE "Seo" SET "isActive" = false,"updatedAt" = $1 WHERE "merchantId" = $2 returning *';
            param = ['NOW()', data.merchantId];
        }
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
        console.log('Error switch SEO ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

async function switchCart(data) {
    try {
        if (data.switch == "on") {
            query = 'UPDATE "Merchants" SET "canOrder" = true WHERE id = $1';
            param = [parseInt(data.merchantId)];
        } else {
            query = 'UPDATE "Merchants" SET "canOrder" = false WHERE id = $1';
            param = [parseInt(data.merchantId)];
        }
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
        console.log('Error switch cart ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

exports.getProduct = function (data) {
    return new Promise(async function (resolve, reject) {
        var gep = '';
        try {
            data.merchantId = data.profile.merchantId;
            let gp = await getProductMerchant(data);
            resolve(gp);
        } catch (e) {
            console.log('Error get template ultipage => ', e)
            notification.sendErrorNotification(e.stack);
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

async function getProductMerchant(data) {
    try {
        if (data.productId) {
            query = 'SELECT * FROM "Products" WHERE "merchantId" = $1 AND id = $2';
            param = [data.merchantId, data.productId];
        } else {
            query = 'SELECT * FROM "Products" WHERE "merchantId" = $1';
            param = [data.merchantId];
        }
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
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
        console.log('Error get product merchant ==> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

function decodeBase64Image(dataString) {
    // console.log('data string ===> ', dataString)
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {};
    if (matches.length !== 3) {
        return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');

    return response;
}

exports.postProduct = function (data) {
    return new Promise(async function (resolve, reject) {
        var gep = '';
        try {
            data.merchantId = data.profile.merchantId;
            // upload image first
            if (data.img) {
                // upload local first 
                // upload image to s3
                var timeToString = Date.now();
                data.scope = 'ultipage'
                data.behalf = 'product'
                if (data.productId) {
                    data.ownerId = data.productId + '-' + timeToString;;
                } else {
                    var glpi = await getLastProductId();
                    if (glpi.responseCode == process.env.SUCCESS_RESPONSE) {
                        data.ownerId = glpi.data[0].id + '-' + timeToString;;
                    } else {
                        data.ownerId = data.pageId + '-' + timeToString;
                    }
                }
                let up = await masterService.uploadImage(data);
                if (up.responseCode == process.env.SUCCESS_RESPONSE) {
                    data.imgPath = up.data[0].path;
                    data.imgType = up.data[0].imgType;
                    data.imgOrigin = up.data[0].imgOrigin;
                    // action product
                    if (data.productId) {
                        gep = await editProductPage(data);
                    } else {
                        gep = await createProductPage(data);
                    }

                    // insert media ultipage
                    if (gep.responseCode == process.env.SUCCESS_RESPONSE) {
                        //start add log
                        logObj = {
                            "accessor": data.profile.fullname,
                            "accessorId": data.profile.phoneCode + '' + data.profile.phone + '_' + data.profile.deviceId,
                            "accessorAddress": data.log.accAddress,
                            "accessorCategory": 'merchant',
                            'link': data.log.link,
                            'method': data.log.method,
                            'status': '200',
                            'moduleName': 'Create Product'
                        };
                        var dataObj = {id: gep.data[0].id, name: gep.data[0].name}
                        var activities = {
                            category: "Ultipage Merchant",
                            module: "Create Product",
                            description: 'Create Product, data : '+JSON.stringify(dataObj),
                            user_id: data.profile.merchantId,
                            user_name: data.profile.email,
                            crud_id: gep.data[0].id
                        }
                        if (data.productId) {
                            logObj.moduleName = 'Edit Product';
                            activities.module = "Edit Product";
                            activities.description = 'Edit Product, data : '+JSON.stringify(dataObj)
                        }
                        logObj.activities = activities;
                        var l = await log.addLog(logObj);
                        console.log('addLog =>',l)
                        //end add log
                                                
                        data.modelId = gep.data[0].id;
                        data.modelType = 'product';
                        // insert media ultipage
                        let im = await insertMedia(data);
                        resolve(im);
                    } else {
                        resolve(gep);
                        return;
                    }
                } else {
                    resolve(up);
                    return;
                }
            } else {
                if (data.productId) {
                    gep = await editProductPage(data);
                } else {
                    gep = await createProductPage(data);
                }
                if (gep.responseCode == process.env.SUCCESS_RESPONSE) {
                    //start add log
                    logObj = {
                        "accessor": data.profile.fullname,
                        "accessorId": data.profile.phoneCode + '' + data.profile.phone + '_' + data.profile.deviceId,
                        "accessorAddress": data.log.accAddress,
                        "accessorCategory": 'merchant',
                        'link': data.log.link,
                        'method': data.log.method,
                        'status': '200',
                        'moduleName': 'Create Product'
                    };
                    var dataObj = {id: gep.data[0].id, name: gep.data[0].name}
                    var activities = {
                        category: "Ultipage Merchant",
                        module: "Create Product",
                        description: 'Create Product, data : '+JSON.stringify(dataObj),
                        user_id: data.profile.merchantId,
                        user_name: data.profile.email,
                        crud_id: gep.data[0].id
                    }
                    if (data.productId) {
                        logObj.moduleName = 'Edit Product';
                        activities.module = "Edit Product";
                        activities.description = 'Edit Product, data : '+JSON.stringify(dataObj)
                    }
                    logObj.activities = activities;
                    var l = await log.addLog(logObj);
                    console.log('addLog =>',l)
                    //end add log
                }                
                delete gep.data;
                resolve(gep);
            }
        } catch (e) {
            console.log('Error get template ultipage => ', e)
            notification.sendErrorNotification(e.stack);
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

async function insertMedia(data) {
    try {
        query = "INSERT INTO medias (model_type,model_id,path,origin,created_at,type) VALUES ('" + data.modelType + "' , '" + data.modelId + "' , '" + data.imgPath + "', '" + data.imgOrigin + "','NOW()','" + data.imgType + "')"
        // console.log('PARAM ===> ', param)
        // exc = await pgCon.query(query, param);
        exc = await pgCon.query(query);
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
        console.log('Error insert media ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

async function createProductPage(data) {
    try {
        if (!data.discountPrice) {
            data.discountPrice = 0;
        }
        if (!data.imgPath) {
            data.imgPath = process.env.DEFAULT_PRODUCT;
        }
        query = 'INSERT INTO "Products" ("merchantId",name,"imageUrl",description,price,"discountPrice","createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *';
        param = [data.merchantId, data.name, data.imgPath, data.description, data.price, data.discountPrice, 'NOW()'];
        console.log('create product query ==> ', query)
        console.log('create product param ==> ', param)
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
        console.log('Error create product page ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}
async function getLastProductId() {
    try {
        query = 'select (id+1) as id from "Products" order by id desc limit 1';
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
        console.log('Error get the last produc tId ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}
async function editProductPage(data) {
    try {
        // if (!data.productId) {
        //     return ({
        //         responseCode: process.env.NOTACCEPT_RESPONSE,
        //         responseMessage: "ID Product required"
        //     })
        // }
        // if (!data.name) {
        //     return ({
        //         responseCode: process.env.NOTACCEPT_RESPONSE,
        //         responseMessage: "Name required"
        //     })
        // }
        // if (!data.imageUrl) {
        //     return ({
        //         responseCode: process.env.NOTACCEPT_RESPONSE,
        //         responseMessage: "URL Image required"
        //     })
        // }
        // if (!data.description) {
        //     return ({
        //         responseCode: process.env.NOTACCEPT_RESPONSE,
        //         responseMessage: "Description required"
        //     })
        // }
        // if (!data.price) {
        //     return ({
        //         responseCode: process.env.NOTACCEPT_RESPONSE,
        //         responseMessage: "Price required"
        //     })
        // }
        // if (!data.discountPrice) {
        //     return ({
        //         responseCode: process.env.NOTACCEPT_RESPONSE,
        //         responseMessage: "Price required"
        //     })
        // }
        if (!data.discountPrice) {
            data.discountPrice = 0;
        }
        if (data.imgPath) {
            //data.imgPath = process.env.DEFAULT_IMAGE;
            query = 'UPDATE "Products" SET name = $1, "imageUrl" = $2, description = $3, price = $4, "discountPrice" = $5, "updatedAt" = $6 WHERE id = $7 RETURNING *';
            param = [data.name, data.imgPath, data.description, data.price, parseInt(data.discountPrice), 'NOW()', data.productId];
        } else {
            query = 'UPDATE "Products" SET name = $1, description = $2, price = $3, "discountPrice" = $4, "updatedAt" = $5 WHERE id = $6 RETURNING *';
            param = [data.name, data.description, data.price, parseInt(data.discountPrice), 'NOW()', data.productId];
        }
        // query = 'UPDATE "Products" SET name = $1, "imageUrl" = $2, description = $3, price = $4, "discountPrice" = $5, "updatedAt" = $6 WHERE id = $7 RETURNING *';
        // param = [data.name, data.imgPath, data.description, data.price, parseInt(data.discountPrice), 'NOW()', data.productId];
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
        console.log('Error edit product page ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

exports.deleteProduct = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            data.merchantId = data.profile.merchantId;
            let gdp = await deleteProductPage(data);
            if(gdp.responseCode == process.env.SUCCESS_RESPONSE){
                //start add log
                logObj = {
                    "accessor": data.profile.fullname,
                    "accessorId": data.profile.phoneCode + '' + data.profile.phone + '_' + data.profile.deviceId,
                    "accessorAddress": data.log.accAddress,
                    "accessorCategory": 'merchant',
                    'link': data.log.link,
                    'method': data.log.method,
                    'status': '200',
                    'moduleName': 'Delete Product'
                };
                dataObj = {id: gdp.data[0].id, name: gdp.data[0].name}
                var activities = {
                    category: "Ultipage Merchant",
                    module: "Delete Product",
                    description: "Delete Product, data : "+JSON.stringify(dataObj),
                    user_id: data.profile.merchantId,
                    user_name: data.profile.email,
                    crud_id: gdp.data[0].id
                }
                logObj.activities = activities;
                var l = await log.addLog(logObj);
                console.log('addLog =>',l)
                //end add log
                if(gdp.data) delete gdp.data;
            }

            resolve(gdp);
        } catch (e) {
            console.log('Error get template ultipage => ', e)
            notification.sendErrorNotification(e.stack);
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error, please try again!"
            }
            resolve(message);
        }
    })
}

async function deleteProductPage(data) {
    console.log('deleteProductPage data =>',data)
    try {
        query = 'DELETE FROM "Products" WHERE id = $1 and "merchantId" = $2 returning *';
        param = [data.productId, data.profile.merchantId];
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
        console.log('Error delete product page ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

exports.getLink = function (data) {
    return new Promise(async function (resolve, reject) {
        try {

            data.merchantId = data.profile.merchantId;
            let gl = await getLinkMerchant(data);
            resolve(gl);
        } catch (e) {
            console.log('Error get template ultipage => ', e)
            notification.sendErrorNotification(e.stack);
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

async function getLinkMerchant(data) {
    try {
        if (data.linkId) {
            query = 'SELECT * FROM "MerchantLinks" WHERE "merchantId" = $1 AND id = $2';
            param = [data.merchantId, data.linkId];
        } else {
            query = 'SELECT * FROM "MerchantLinks" WHERE "merchantId" = $1';
            param = [data.merchantId];
        }
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
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
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

exports.postLink = function (data) {
    return new Promise(async function (resolve, reject) {
        let link = '';
        try {
            data.merchantId = data.profile.merchantId;
            if (data.linkId) {
                link = await editLinkPage(data);
                console.log('editLinkPage =>',link)
            } else {
                link = await createLinkPage(data);
            }
            if(link.responseCode == process.env.SUCCESS_RESPONSE){
                //start add log
                logObj = {
                    "accessor": data.profile.fullname,
                    "accessorId": data.profile.phoneCode + '' + data.profile.phone + '_' + data.profile.deviceId,
                    "accessorAddress": data.log.accAddress,
                    "accessorCategory": 'merchant',
                    'link': data.log.link,
                    'method': data.log.method,
                    'status': '200',
                    'moduleName': 'Create Merchant Link'
                };
                var dataObj = {id: link.data[0].id, name: link.data[0].name}
                var activities = {
                    category: "Ultipage Merchant",
                    module: "Create Merchant Link",
                    description: 'Create Merchant Link, data : '+JSON.stringify(dataObj),
                    user_id: data.profile.merchantId,
                    user_name: data.profile.email,
                    crud_id: link.data[0].id
                }
                if (data.linkId) {
                    logObj.moduleName = 'Edit Merchant Link';
                    activities.module = "Edit Merchant Link";
                    activities.description = 'Edit Merchant Link, data : '+JSON.stringify(dataObj)
                }
                logObj.activities = activities;
                var l = await log.addLog(logObj);
                console.log('addLog =>',l)
                //end add log
                if(link.data) delete link.data;
            }
            resolve(link);
        } catch (e) {
            console.log('Error get template ultipage => ', e)
            notification.sendErrorNotification(e.stack);
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

async function createLinkPage(data) {
    try {
        query = 'INSERT INTO "MerchantLinks" ("merchantId",name,link,"createdAt") VALUES ($1,$2,$3,$4) returning *'
        param = [data.merchantId, data.name, data.link, 'NOW()'];
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
        console.log('Error create link page ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

async function editLinkPage(data) {
    try {
        if (!data.linkId) {
            return ({
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: "ID Link required"
            })
        }
        if (!data.name) {
            return ({
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: "Name required"
            })
        }
        if (!data.link) {
            return ({
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: "Link required"
            })
        }
        query = 'UPDATE "MerchantLinks" SET name = $1, link = $2, "updatedAt" = $3 WHERE id = $4 returning *';
        param = [data.name, data.link, 'NOW()', data.linkId];
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
        console.log('Error edit link page ==> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

exports.deleteLink = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            data.merchantId = data.profile.merchantId;
            let dlp = await deleteLinkPage(data);
            if(dlp.responseCode == process.env.SUCCESS_RESPONSE){
                //start add log
                logObj = {
                    "accessor": data.profile.fullname,
                    "accessorId": data.profile.phoneCode + '' + data.profile.phone + '_' + data.profile.deviceId,
                    "accessorAddress": data.log.accAddress,
                    "accessorCategory": 'merchant',
                    'link': data.log.link,
                    'method': data.log.method,
                    'status': '200',
                    'moduleName': 'Delete Merchant Link'
                };
                var dataObj = {id: dlp.data[0].id, name: dlp.data[0].name}
                var activities = {
                    category: "Ultipage Merchant",
                    module: "Delete Merchant Link",
                    description: "Delete Merchant Link, data : "+JSON.stringify(dataObj),
                    user_id: data.profile.merchantId,
                    user_name: data.profile.email,
                    crud_id: dlp.data[0].id
                }
                logObj.activities = activities;
                var l = await log.addLog(logObj);
                console.log('addLog =>',l)
                //end add log
                if(dlp.data) delete dlp.data;
            }                
            resolve(dlp);
        } catch (e) {
            console.log('Error get template ultipage => ', e)
            notification.sendErrorNotification(e.stack);
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

async function deleteLinkPage(data) {
    try {
        // console.log('deleteLinkPage =>',deleteLink)
        if (!data.linkId) {
            return ({
                responseCode: process.env.ERRORINTERNAL_RESPONSE,
                responseMessage: "ID Link required"
            })
        }
        query = 'DELETE FROM "MerchantLinks" WHERE id = $1 and "merchantId" = $2 returning *';
        param = [data.linkId, data.profile.merchantId];
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
        console.log('Error delete link page ==> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

exports.getUrl = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            data.merchantId = data.profile.merchantId;
            let gum = await getUrlMerchant(data);
            resolve(gum);
        } catch (e) {
            console.log('Error get url ultipage => ', e)
            notification.sendErrorNotification(e.stack);
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

async function getUrlMerchant(data) {
    try {
        query = 'SELECT "urlName" FROM "Merchants" WHERE id = $1'
        param = [data.merchantId];
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
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
        console.log('Error get url merchant ==> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

exports.editUrl = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            data.merchantId = data.profile.merchantId;
            if (!data.urlName) {
                resolve({
                    responseCode: process.env.NOTACCEPT_RESPONSE,
                    responseMessage: "URL Name required"
                })
                return;
            }
            let dlp = await editUrlName(data);
            if(dlp.responseCode == process.env.SUCCESS_RESPONSE){
                
                //start add log
                logObj = {
                    "accessor": data.profile.fullname,
                    "accessorId": data.profile.phoneCode + '' + data.profile.phone + '_' + data.profile.deviceId,
                    "accessorAddress": data.log.accAddress,
                    "accessorCategory": 'merchant',
                    'link': data.log.link,
                    'method': data.log.method,
                    'status': '200',
                    'moduleName': 'Change Url Merchant'
                };
                dataObj = {id: dlp.data[0].id, url: data.newUrlName }
                var activities = {
                    category: "Ultipage Merchant",
                    module: "Change Url",
                    description: "Change Url, data : "+JSON.stringify(dataObj),
                    user_id: data.profile.merchantId,
                    user_name: data.profile.email,
                    crud_id: dlp.data[0].id
                }
                logObj.activities = activities;
                var l = await log.addLog(logObj);
                console.log('addLog =>',l)
                //end add log
                if(dlp.data) delete dlp.data;
            }
            resolve(dlp);
        } catch (e) {
            console.log('Error get template ultipage => ', e)
            notification.sendErrorNotification(e.stack);
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

async function editUrlName(data) {
    try {
        if (!data.urlName) {
            return ({
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: "Name URL Required"
            })
        }
        query = 'SELECT * FROM "Merchants" WHERE "urlName" = $1 AND id <> $2';
        param = [data.urlName, data.merchantId];
        console.log('query =>',{
            query:query, 
            param:param
        })
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
            return ({
                responseCode: process.env.EXIST_RESPONSE,
                responseMessage: "URL already in use"
            })
        }else{
            query = 'UPDATE "Merchants" SET "urlName" = $1 WHERE id = $2 returning *';
            param = [data.urlName, data.merchantId];
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
        }
    } catch (e) {
        console.log('Error edit url name ==> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

async function getSeoMerchant(data) {
    try {
        query = 'SELECT s.*, "urlName" FROM "Seo" s, "Merchants" m WHERE s."merchantId"=m.id and s."merchantId" = $1';
        param = [data.merchantId];
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
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
        console.log("Error get seo merchant ===> ", e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

exports.getSeo = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            data.merchantId = data.profile.merchantId;
            let dlp = await getSeoMerchant(data);
            resolve(dlp);
        } catch (e) {
            console.log('Error get template ultipage => ', e)
            notification.sendErrorNotification(e.stack);
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

exports.postSeo = function (data) {
    return new Promise(async function (resolve, reject) {
        let clp = '';
        try {
            data.merchantId = data.profile.merchantId;
            if(data.isActive) { // update on/off seo
                clp = await activeSeoMerchant(data);
                console.log('activeSeoMerchant =>',clp)
                if(clp.responseCode == process.env.SUCCESS_RESPONSE) {
                    if(clp.data) {
                        //start add log
                        logObj = {
                            "accessor": data.profile.fullname,
                            "accessorId": data.profile.phoneCode + '' + data.profile.phone + '_' + data.profile.deviceId,
                            "accessorAddress": data.log.accAddress,
                            "accessorCategory": 'merchant',
                            'link': data.log.link,
                            'method': data.log.method,
                            'status': '200',
                            'moduleName': 'Active Seo Tool'
                        };
                        dataObj = {id: clp.data[0].id, active: true}
                        var activities = {
                            category: "Ultipage Merchant",
                            module: "Active Seo Tool",
                            description: "Active Seo Tool, data : "+JSON.stringify(dataObj),
                            user_id: data.profile.merchantId,
                            user_name: data.profile.email,
                            crud_id: clp.data[0].id 
                        }
                        if(clp.data[0].isActive == false){
                            dataObj.active = false;
                            logObj.moduleName = 'Inactive Seo Tool';
                            activities.description = "Inactive Seo Tool, data : "+JSON.stringify(dataObj);
                            activities.module = "Inactive Seo Tool";
                        }
                        logObj.activities = activities;
                        var l = await log.addLog(logObj);
                        console.log('addLog =>',l)
                        //end add log
                        if(clp.data) delete clp.data
                    }
                }
            }else {
                if (data.seoId) {
                    clp = await editSeoMerchant(data);
                } else {
                    // check SEO data is already exist or not
                    let cs = await getSeoMerchant(data);
                    if (cs.responseCode == process.env.SUCCESS_RESPONSE) {
                        resolve({
                            responseCode: process.env.NOTACCEPT_RESPONSE,
                            responseMessage: "Already exist"
                        })
                        return;
                    } else {
                        clp = await createSeoMerchant(data);
                    }
                }
                console.log('clp =>',clp)
                if(clp.responseCode == process.env.SUCCESS_RESPONSE) {
                    //start add log
                    logObj = {
                        "accessor": data.profile.fullname,
                        "accessorId": data.profile.phoneCode + '' + data.profile.phone + '_' + data.profile.deviceId,
                        "accessorAddress": data.log.accAddress,
                        "accessorCategory": 'merchant',
                        'link': data.log.link,
                        'method': data.log.method,
                        'status': '200',
                        'moduleName': 'Active Seo Toll'
                    };
                    dataObj = {id: clp.data[0].id, title: clp.data[0].title}
                    var activities = {
                        category: "Ultipage Merchant",
                        module: "Create Seo Tool",
                        description: "Create Seo Tool, data : "+JSON.stringify(dataObj),
                        user_id: data.profile.merchantId,
                        user_name: data.profile.email,
                        crud_id: clp.data[0].id 
                    }
                    if (data.seoId) {
                        logObj.moduleName = 'Edit Seo Tool';
                        activities.description = "Edit Seo Tool, data : "+JSON.stringify(dataObj);
                        activities.module = "Edit Seo Tool";
                    }
                    logObj.activities = activities;
                    var l = await log.addLog(logObj);
                    console.log('addLog =>',l)
                    //end add log
                    if(clp.data) delete clp.data
                }
            }
            resolve(clp);
        } catch (e) {
            console.log('Error get template ultipage => ', e)
            notification.sendErrorNotification(e.stack);
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
            return;
        }
    })
}

// async function checkSeoMerchant(data) {
//     try {
//         query = 'SELECT * FROM "Seo" WHERE "merchantId" = $1';
//         param = [data.merchantId];
//         exc = await pgCon.query(query, param);
//         if (exc.rowCount > 0) {
//             return ({
//                 responseCode: process.env.SUCCESS_RESPONSE,
//                 responseMessage: "Success",
//                 data : exc.rows;
//             })
//         } else {
//             return ({
//                 responseCode: process.env.NOTFOUND_RESPONSE,
//                 responseMessage: "Not found"
//             })
//         }
//     } catch (e) {
//         console.log("Error check seo merchant ===> ", e);
//         return ({
//             responseCode: process.env.ERRORINTERNAL_RESPONSE,
//             responseMessage: "Internal server error"
//         })
//     }
// }

async function createSeoMerchant(data) {
    try {
        if (!data.title) {
            return ({
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: "Title required"
            })
        }

        if (!data.keyword) {
            return ({
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: "Keyword required"
            })
        }

        if (!data.description) {
            return ({
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: "Description required"
            })
        }

        query = 'INSERT INTO "Seo" ("merchantId",title,description,keyword,"createdAt") VALUES ($1,$2,$3,$4,$5) returning *';
        param = [data.merchantId, data.title, data.description, data.keyword, 'NOW()'];
        exc = await pgCon.query(query, param)
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
        console.log('Error create seo merchant ==> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

async function editSeoMerchant(data) {
    try {
        if (!data.title) {
            return ({
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: "Title required"
            })
        }

        if (!data.keyword) {
            return ({
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: "Keyword required"
            })
        }

        if (!data.description) {
            return ({
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: "Description required"
            })
        }
        query = 'UPDATE "Seo" SET title = $1, description = $2, keyword = $3, "updatedAt" = $4 WHERE "merchantId" = $5 returning *';
        param = [data.title, data.description, data.keyword, 'NOW()', data.merchantId];
        exc = await pgCon.query(query, param)
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
        console.log('Error edit seo merchant ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}
async function activeSeoMerchant(data) {
    console.log('activeSeoMerchant data=>',data)
    try {
        if (!data.isActive) {
            return ({
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: "isActive required"
            })
        }

        //check record, update/insert
        query = 'select id from "Seo" WHERE "merchantId" = $1';
        param = [data.merchantId];
        exc = await pgCon.query(query, param)
        console.log('exc =>',exc.rowCount)
        if (exc.rowCount > 0) {
            query = 'UPDATE "Seo" SET "isActive" = $1, "updatedAt" = $2 WHERE "merchantId" = $3 returning *';
            param = [data.isActive, 'NOW()', data.merchantId];
        }else{
            query = 'INSERT INTO "Seo" ("merchantId","isActive","createdAt") VALUES ($1,$2,$3) returning *';
            param = [data.merchantId, data.isActive, 'NOW()'];    
        }
        exc = await pgCon.query(query, param)
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
        console.log('Error edit activeSeoMerchant ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}
exports.getPaymentMethod = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            data.merchantId = data.profile.merchantId;
            let dlp = await getPaymentMethod(data);
            resolve(dlp);
        } catch (e) {
            console.log('Error get payment method ===> ', e)
            notification.sendErrorNotification(e.stack);
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

async function getPaymentMethod(data) {
    try {
        var param= {}, qry='';
        if(data.param) { param = JSON.parse(data.param)}
        if (param.id) {
            qry += ` and id='`+param.id+`'`;
        }
        if (param.name) {
            qry += ` and lower(name) like lower('%`+param.name+`%')`;
        }
        if (param.code) {
            qry += ` and lower(code) like lower('%`+param.code+`%')`;
        }
        if (param.isAvailable) {
            qry += ` and "isAvailable" = `+param.isAvailable;
        }
        console.log('query =>',qry)

        query = 'SELECT id,name,code,"imageUrl","isAvailable",driver,"isDefault" FROM "PaymentMethods" where id is not null '+qry;
        exc = await pgCon.query(query);
        if (exc.rowCount > 0) {
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
        console.log('Error get payment method ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

exports.uploadImage = function (data) {
    // console.log('uploadImage data=>',data)
    return new Promise(async function (resolve, reject) {
        try {
            var priorDate = new Date();
            var expDay = priorDate.getDate();
            var expMonth = priorDate.getMonth() + 1;
            var expYear = priorDate.getFullYear();
            let tmpMonth = ("0" + expMonth).slice(-2); //convert bulan supaya selalu 2 digits
            let tmpDate = ("0" + expDay).slice(-2); //convert hari supaya selalu 2 digits
            var convertDate = expYear + "" + tmpMonth + "" + tmpDate;
            var dateObj = new Date().getTime();

            data.merchantId = data.profile.merchantId;
            var pic = JSON.parse(data.img);
            let dd = decodeBase64Image(pic[0]);
            let fileOrigin = './img/' + data.behalf + '-' + convertDate + '-' + data.merchantId + '-' + randomString() + '.jpeg';
            fs.writeFile(fileOrigin, dd.data, async function (err) {
                if (!err) {
                    let dlp = await uploadImageMerchant(data);
                    console.log('uploadImageMerchant =>', dlp)
                    dlp.data[0].imgType = dd.type;
                    dlp.data[0].imgOrigin = fileOrigin;
                    resolve(dlp);
                    // resolve({
                    //     responseCode : process.env.SUCCESS_RESPONSE,
                    //     responseMessage : "Success"
                    // })
                } else {
                    console.log('Error upload file to directory ===> ', err);
                    resolve({
                        responseCode: process.env.ERRORINTERNAL_RESPONSE,
                        responseMessage: "Internal server error, please try again!"
                    })
                    return;
                }
            })
        } catch (e) {
            console.log('Error post product ===> ', e)
            notification.sendErrorNotification(e.stack);
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

function uploadImageMerchant(data) {
    return new Promise(async function (resolve, reject) {
        try {
            var options = {
                // 'method': 'POST',
                // // 'url': process.env.BACKEND_SERVICE_HOST + '/uploadFormData',
                // 'url': process.env.BACKEND_SERVICE_HOST + '/uploadFileFormData',
                // 'headers': {
                //     'apiService': process.env.SERVICE_CODE,
                // },
                // form: {
                //     'behalf': data.behalf,
                //     'file': data.img,
                //     'ownerId': data.merchantId,
                //     'scope': data.scope,
                // }

                'method': 'POST',
                'url': process.env.BACKEND_SERVICE_HOST + '/uploadFileFormData',
                'headers': {
                    'apiService': process.env.SERVICE_CODE,
                },
                formData: {
                    'behalf': data.behalf,
                    'file': JSON.parse(data.img),
                    'ownerId': data.ownerId,
                    'scope': data.scope,
                }

            };
            request(options, function (error, response) {
                if (error) {
                    resolve({
                        responseCode: process.env.ERRORINTERNAL_RESPONSE,
                        responseMessage: "Internal server error, please try again!"
                    })
                } else {
                    console.log('UPLOAD PICTURE TO BACKEND ==> ', response.body);
                    resolve(JSON.parse(response.body));
                }
            });
        } catch (e) {
            console.log('Error upload image ===> ', e);
            notification.sendErrorNotification(e.stack);
            resolve({
                responseCode: process.env.ERRORINTERNAL_RESPONSE,
                responseMessage: "Internal server error, please try again!"
            })
        }
    })
}

Date.prototype.minDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() - days);
    return date;
}

Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

exports.getInsight = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            let tempView = {};
            tempView.view = {};
            tempView.bioLink = {};
            tempView.product = {};
            let arrViewDaysData = [];
            let arrViewMonthData = [];

            // get now date
            var priorDate = new Date();
            // // priorDate = priorDate.addDays(1); // untuk query jadi harus +1 biar dapat untuk tanggal hari ini sampai jam 23.59
            // var expDay = priorDate.getDate();
            // var expYear = priorDate.getFullYear();
            // var expMonth = parseInt(priorDate.getMonth()) + 1;
            // let tmpMonth = ("0" + expMonth).slice(-2);
            // let tmpDay = ("0" + expDay).slice(-2);
            // var convertDate = expYear + "-" + tmpMonth + "-" + tmpDay;
            // var dateObj = new Date().getTime();
            data.nowDate = await dateToString(priorDate);

            // get minus 7 day
            var date = new Date();
            let sevenDate = date.minDays(6);

            // var sevenDay = sevenDate.getDate();
            // var sevenYear = sevenDate.getFullYear();
            // var sevenMonth = parseInt(sevenDate.getMonth()) + 1;
            // let tmpSevenMonth = ("0" + sevenMonth).slice(-2);
            // let tmpSevenDay = ("0" + sevenDay).slice(-2);
            // var convertDateSeven = sevenYear + "-" + tmpSevenMonth + "-" + tmpSevenDay;
            data.sevenDate = await dateToString(sevenDate);
            // data.sevenDate = convertDateSeven;

            // ============= GET INSIGHT 30 DAYS =================
            // get minus 30 day
            var date = new Date();
            let thirtyDate = date.minDays(30);
            // var thirtyDay = thirtyDate.getDate();
            // var thirtyYear = thirtyDate.getFullYear();
            // var thirtyMonth = parseInt(thirtyDate.getMonth()) + 1;
            // let tmpThirtyMonth = ("0" + thirtyMonth).slice(-2);
            // let tmpThirtyDay = ("0" + thirtyDay).slice(-2);
            // var convertDateThirty = thirtyYear + "-" + tmpThirtyMonth + "-" + tmpThirtyDay;
            data.thirtyDate = await dateToString(thirtyDate);

            
            data.merchantId = data.profile.merchantId;

            // ============= GET INSIGHT 7 DAYS =================
            // get insight view 
            var gv = await getInsightData(data);
            console.log('getInsightData =>',gv)
            resolve(gv)

            // let vp = await getInsightViewProfile(data);
            // console.log('VP ===> ', vp)
            // if (vp.responseCode == process.env.SUCCESS_RESPONSE) {
            //     arrViewDaysData.push(vp.data[0]);
            //     tempView.view.day = arrViewDaysData;
            // } else if (vp.responseCode == process.env.NOTFOUND_RESPONSE) {

            // }

            // // get insight view catalogue
            // let vc = await getInsightViewCatalogue(data);
            // console.log('VC ===> ', vc)
            // if (vc.responseCode == process.env.SUCCESS_RESPONSE) {
            //     arrViewDaysData.push(vc.data[0]);
            //     tempView.view.day = arrViewDaysData;
            // }

            // // get insight bio link
            // let bl = await getInsightBioLink(data);
            // console.log('BL ===> ', bl);
            // if (bl.responseCode == process.env.SUCCESS_RESPONSE) {
            //     tempView.bioLink.day = bl.data;
            // }



            // // get insight product catalogue 
            // let pc = await getInsightProductCatalogue(data);
            // console.log('pc ==> ', pc)
            // if (pc.responseCode == process.env.SUCCESS_RESPONSE) {
            //     tempView.product.day = pc.data;
            // }



            // // start get data insight 30 day
            // let pv = await getInsightViewProfile(data);
            // console.log('PV ===> ', pv)
            // if (pv.responseCode == process.env.SUCCESS_RESPONSE) {
            //     arrViewMonthData.push(pv.data[0]);
            //     tempView.view.month = arrViewMonthData;
            // }

            // console.log('temp view ===> ', tempView)
            // let cv = await getInsightViewCatalogue(data);
            // console.log('cv ===> ', cv)
            // if (cv.responseCode == process.env.SUCCESS_RESPONSE) {
            //     arrViewMonthData.push(cv.data[0]);
            //     tempView.view.month = arrViewMonthData;
            // }

            // let cp = await getInsightProductCatalogue(data);
            // console.log('cp ==> ', cp)
            // if (cp.responseCode == process.env.SUCCESS_RESPONSE) {
            //     tempView.product.month = cp.data;
            // }

            // let lb = await getInsightBioLink(data);
            // console.log('lb ===> ', lb);
            // if (lb.responseCode == process.env.SUCCESS_RESPONSE) {
            //     tempView.bioLink.month = lb.data;
            // }

            // resolve({
            //     responseCode: process.env.SUCCESS_RESPONSE,
            //     responseMessage: "Success",
            //     data: tempView
            // })

        } catch (e) {
            console.log('Error get payment method ===> ', e)
            notification.sendErrorNotification(e.stack);
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

async function getInsightViewProfile(data) {
    console.log('getInsightViewProfile =>',data)
    try {
        query = 'SELECT count(id) as jumlah from "Visits" WHERE type = $1 and "visitableType" = $2 and "visitableId" = $3';
        param = ['view', 'Merchant', data.merchantId];
        if (data.thirtyDate) {
            query = 'SELECT count(id) as jumlah from "Visits" WHERE type = $1 and "visitableType" = $2 and "visitableId" = $3 and "createdAt" >= $4 and "createdAt" <= $5';
            param = ['view', 'Merchant', '2', data.thirtyDate, data.nowDate];
        }
        if (data.sevenDate) {
            query = 'SELECT count(id) as jumlah from "Visits" WHERE type = $1 and "visitableType" = $2 and "visitableId" = $3 and "createdAt" >= $4 and "createdAt" <= $5';
            param = ['view', 'Merchant', '2', data.sevenDate, data.nowDate];
        }

        console.log('query get insight view profile ==========> ', {
            query: query,
            param: param
        })
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
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
        console.log('Error get insight view profile ==> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

async function getInsightViewCatalogue(data) {
    try {
        query = 'SELECT count(id) as jumlah from "Visits" WHERE type = $1 and "visitableType" = $2 and "ownerId" = $3 ';
        param = ['view', 'Product', data.merchantId];
        if (data.thirtyDate) {
            query = 'SELECT count(id) as jumlah from "Visits" WHERE type = $1 and "visitableType" = $2 and "ownerId" = $3 and "createdAt" >= $4 and "createdAt" <= $5';
            param = ['view', 'Product', data.merchantId, data.thirtyDate, data.nowDate];
        }
        if (data.sevenDate) {
            query = 'SELECT count(id) as jumlah from "Visits" WHERE type = $1 and "visitableType" = $2 and "ownerId" = $3 and "createdAt" >= $4 and "createdAt" <= $5';
            param = ['view', 'Product', data.merchantId, data.sevenDate, data.nowDate];
        }

        console.log('query get insight view catalogue ==========> ', {
            query: query,
            param: param
        })
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
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
        console.log('Error get insight view catalogue ==> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

async function getInsightProductCatalogue(data) {
    console.log('getInsightProductCatalogue data=>', data.arrayOfProduct)
    try {
        query = `SELECT count(id) as jumlah from "Visits" WHERE "visitableType" = $1 and "visitableId" IN ` + "(" + data.arrayOfProduct.toString() + ")" + ` and type = $2`;
        param = ['Product', 'click'];
        if (data.thirtyDate) {
            query = `SELECT count(id) as jumlah from "Visits" WHERE "visitableType" = $1 and "visitableId" IN ` + "(" + data.arrayOfProduct.toString() + ")" + ` and type = $2 and "createdAt" >= $3 and "createdAt" <= $4`;
            param = ['Product', 'click', data.thirtyDate, data.nowDate];
        }
        if (data.sevenDate) {
            query = `SELECT count(id) as jumlah from "Visits" WHERE "visitableType" = $1 and "visitableId" IN ` + "(" + data.arrayOfProduct.toString() + ")" + ` and type = $2 and "createdAt" >= $3 and "createdAt" <= $4`;
            param = ['Product', 'click', data.sevenDate, data.nowDate];
        }

        console.log('query insight product catalogue ==========> ', {
            query: query,
            param: param
        })
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
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
        console.log('Error get insight product catalogue ==> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

async function getInsightBioLink(data) {
    try {
        query = `SELECT count(id) as jumlah from "Visits" WHERE "visitableType" = $1 and "visitableId" IN ` + "(" + data.arrayOfProduct.toString() + ")" + ` and type = $2`;
        param = ['MerchantLink', 'click'];
        if (data.thirtyDate) {
            query = `SELECT count(id) as jumlah from "Visits" WHERE "visitableType" = $1 and "visitableId" IN ` + "(" + data.arrayOfProduct.toString() + ")" + ` and type = $2 and "createdAt" >= $3 and "createdAt" <= $4`;
            param = ['Product', 'click', data.thirtyDate, data.nowDate];
        }
        if (data.sevenDate) {
            query = `SELECT count(id) as jumlah from "Visits" WHERE "visitableType" = $1 and "visitableId" IN ` + "(" + data.arrayOfProduct.toString() + ")" + ` and type = $2 and "createdAt" >= $3 and "createdAt" <= $4`;
            param = ['Product', 'click', data.sevenDate, data.nowDate];
        }

        console.log('query insight product catalogue ==========> ', {
            query: query,
            param: param
        })
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
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
        console.log('Error get insight bio link ==> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

async function getInsightData(data) {
    console.log('getInsightData data =>',data)
    try {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var qry = {}, result={}, p={};
        var viewProfile = {}, viewCatalogue = {}, breakDownProfile={};
        var link = {}, product = {};
        p=data;
        // //--start get viewProfile--
        p.startDate = data.sevenDate;
        p.type = 'Profile';
        var gv = await getVisit(p);
        if(gv.responseCode == process.env.SUCCESS_RESPONSE) {
            viewProfile.days=gv.data[0].qty;
        }else{
            viewProfile.days=0;
        }

        p.startDate = data.thirtyDate
        var gv = await getVisit(p);
        if(gv.responseCode == process.env.SUCCESS_RESPONSE) {
            viewProfile.month=gv.data[0].qty;
        }else{
            viewProfile.month=0;
        }
        // //--end get viewProfile--
        
        // //--start get viewCatalogue--
        p.startDate = data.sevenDate;
        p.type = 'Catalogue';
        var gv = await getVisit(p);
        if(gv.responseCode == process.env.SUCCESS_RESPONSE) {
            viewCatalogue.days=gv.data[0].qty;
        }else{
            viewCatalogue.days=0;
        }

        p.startDate = data.thirtyDate
        var gv = await getVisit(p);
        if(gv.responseCode == process.env.SUCCESS_RESPONSE) {
            viewCatalogue.month=gv.data[0].qty;
        }else{
            viewCatalogue.month=0;
        }
        // //--end get viewCatalogue--

        // //--start get breakDownProfile--
        // // --sevenDate--
        var arrData = [], arrLabel = [], arrValue = [];
        p.startDate = data.sevenDate;
        p.type = 'breakDownProfile';
        var gv = await getVisit(p);
        console.log('breakDownProfile sevenDate =>',gv);
        var d = new Date(data.sevenDate)
        var dts = await dateToString(d);
        var now = new Date()
        var daysPeriod = d.getDate() + " " + monthNames[d.getMonth()] + " - " + now.getDate() + " " + monthNames[now.getMonth()] + " " + now.getFullYear();
        breakDownProfile.daysPeriod=daysPeriod;
        if(gv.responseCode == process.env.SUCCESS_RESPONSE) {            
            console.log('dateToString =>',dts)
            for(var i = 0; i <7 ;i++){
                var tmp = d.addDays(i)
                var dts = await dateToString(tmp);
                var qty=0;
                gv.data.forEach(el =>{
                    if(dts == el.days) {
                        qty = parseInt(el.qty);
                    }
                })
                var lbl = tmp.getDate() + " " + monthNames[tmp.getMonth()];
                arrData.push({label: lbl, data: qty});
                arrLabel.push(lbl);
                arrValue.push(qty);
            }
            breakDownProfile.days = arrData;
            breakDownProfile.daysLabel = arrLabel;
            breakDownProfile.daysData = arrValue;
        }else{
            for(var i = 0; i <7 ;i++){
                var tmp = d.addDays(i)
                var dts = await dateToString(tmp);
                var qty=0;
                var lbl = tmp.getDate() + " " + monthNames[tmp.getMonth()];
                arrData.push({label: lbl, data: qty});
                arrLabel.push(lbl);
                arrValue.push(qty);
            }
            breakDownProfile.days = arrData;
            breakDownProfile.daysLabel = arrLabel;
            breakDownProfile.daysData = arrValue;    
        }
        // // --thirtyDate--
        arrData = [], arrLabel = [], arrValue = [];;
        p.startDate = data.thirtyDate;
        var gv = await getVisit(p);
        console.log('breakDownProfile thirtyDate =>',gv);
        var d = new Date(data.thirtyDate)
        var dts = await dateToString(d);
        var now = new Date()
        var monthPeriod = d.getDate() + " " + monthNames[d.getMonth()] + " - " + now.getDate() + " " + monthNames[now.getMonth()] + " " + now.getFullYear();
        breakDownProfile.monthPeriod=monthPeriod;

        if(gv.responseCode == process.env.SUCCESS_RESPONSE) {
            for(var i = 1; i <6 ;i++){
                var max = 6 * i;
                var min = 6 * (i-1);
                var tmp = d.addDays(max)
                var dtsMax = await dateToString(tmp);
                var dMax = new Date(dtsMax)

                var tmp = d.addDays(min)
                var dtsMin = await dateToString(tmp);
                var dMin = new Date(dtsMin)

                var qty=0;
                gv.data.forEach(el =>{
                    var days = new Date(el.days);
                    if((days >= dMin) && (days <= dMax)) {                        
                        qty += parseInt(el.qty);
                    }
                })
                var label = 'Week '+i;
                // arrData.push({label: label, data: qty});
                arrLabel.push(label);
                arrValue.push(qty);

            }
            // breakDownProfile.month = arrData;
            breakDownProfile.monthLabel = arrLabel;
            breakDownProfile.monthData = arrValue;                
        }else{
            for(var i = 1; i <6 ;i++){
                var qty=0;
                var label = 'Week '+i;
                // arrData.push({label: label, data: qty});
                arrLabel.push(label);
                arrValue.push(qty);

            }
            // breakDownProfile.month = arrData;
            breakDownProfile.monthLabel = arrLabel;
            breakDownProfile.monthData = arrValue;                
        }
        // //--end get breakDownProfile--

        // //--start get merchantLink --
        // // --sevenDate--
        var dataLink=[];
        var maxLink=5; //8
        p.startDate = data.sevenDate;
        p.type = 'merchantLink';
        var gv = await getVisit(p);
        console.log('merchantLink sevenDate =>',gv);
        if(gv.responseCode == process.env.SUCCESS_RESPONSE) {
            gv.data.forEach(el=>{
                dataLink.push({name: el.name, qty: el.qty});
            })
            var l = maxLink - gv.data.length;
            for(var i=0; i < l; i++) {
                dataLink.push({name:'Link Text', qty: 0});
            }
            link.days=dataLink;
        }else{
            for(var i=0; i < maxLink; i++) {
                dataLink.push({name:'Link Text', qty: 0});
            }
            link.days=dataLink;
        }
        // // --thirtyDate--
        var dataLink=[];
        var maxLink=5; //8
        p.startDate = data.thirtyDate;
        p.type = 'merchantLink';
        var gv = await getVisit(p);
        console.log('merchantLink thirtyDate =>',gv);
        if(gv.responseCode == process.env.SUCCESS_RESPONSE) {
            gv.data.forEach(el=>{
                dataLink.push({name: el.name, qty: el.qty});
            })
            for(var i=0; i < (maxLink - gv.data.length); i++) {
                dataLink.push({name:'Link Text', qty: 0});
            }
            link.month=dataLink;
        }else{
            for(var i=0; i < maxLink; i++) {
                dataLink.push({name:'Link Text', qty: 0});
            }
            link.month=dataLink;
        }
        // //--end get merchantLink --

        // //--start get product --
        // // --sevenDate--
        var dataProduct=[];
        var maxProduct=5; //8
        p.startDate = data.sevenDate;
        p.type = 'Product';
        var gv = await getVisit(p);
        console.log('getProduct sevenDate =>',gv);
        if(gv.responseCode == process.env.SUCCESS_RESPONSE) {
            gv.data.forEach(el=>{
                dataProduct.push({name: el.name, qty: el.qty});
            })
            var l = maxProduct - gv.data.length;
            for(var i=0; i < l; i++) {
                dataProduct.push({name:'Product Text', qty: 0});
            }
            product.days=dataProduct;
        }else{
            for(var i=0; i < maxProduct; i++) {
                dataProduct.push({name:'Product Text', qty: 0});
            }
            product.days=dataProduct;
        }
        // // --thirtyDate--
        var dataProduct=[];
        var maxProduct=5; //8
        p.startDate = data.thirtyDate;
        p.type = 'Product';
        var gv = await getVisit(p);
        console.log('getProduct thirtyDate =>',gv);
        if(gv.responseCode == process.env.SUCCESS_RESPONSE) {
            gv.data.forEach(el=>{
                dataProduct.push({name: el.name, qty: el.qty});
            })
            for(var i=0; i < (maxProduct - gv.data.length); i++) {
                dataProduct.push({name:'Product Text', qty: 0});
            }
            product.month=dataProduct;
        }else{
            for(var i=0; i < maxProduct; i++) {
                dataProduct.push({name:'Product Text', qty: 0});
            }
            product.month=dataProduct;
        }
        // //--end get merchantLink --

        

        result.viewProfile = viewProfile;
        result.viewCatalogue = viewCatalogue;
        result.breakDownProfile = breakDownProfile;
        result.link = link;
        result.product = product;

        return ({
            responseCode: process.env.SUCCESS_RESPONSE,
            responseMessage: "Success",
            data: result
        })

        // if (data.thirtyDate) {
        //     query = `SELECT count(id) as jumlah from "Visits" WHERE "visitableType" = $1 and "visitableId" IN ` + "(" + data.arrayOfProduct.toString() + ")" + ` and type = $2 and "createdAt" >= $3 and "createdAt" <= $4`;
        //     param = ['Product', 'click', data.thirtyDate, data.nowDate];
        // }
        // if (data.sevenDate) {
        //     query = `SELECT count(id) as jumlah from "Visits" WHERE "visitableType" = $1 and "visitableId" IN ` + "(" + data.arrayOfProduct.toString() + ")" + ` and type = $2 and "createdAt" >= $3 and "createdAt" <= $4`;
        //     param = ['Product', 'click', data.sevenDate, data.nowDate];
        // }

        // console.log('query insight product catalogue ==========> ', {
        //     query: query,
        //     param: param
        // })
        // exc = await pgCon.query(query, param);
        // if (exc.rowCount > 0) {
        //     return ({
        //         responseCode: process.env.SUCCESS_RESPONSE,
        //         responseMessage: "Success",
        //         data: exc.rows
        //     })
        // } else {
        //     return ({
        //         responseCode: process.env.NOTFOUND_RESPONSE,
        //         responseMessage: "Not found"
        //     })
        // }
    } catch (e) {
        console.log('Error getInsightData ==> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

async function getVisit(data) {
    try {
        switch (data.type) {
            case "Profile":
                query = `SELECT count(id) as qty from "Visits" WHERE type = $1 and "visitableType" = $2 and "ownerId" = $3 and to_char("createdAt",'yyyy-mm-dd') >= $4  and to_char("createdAt",'yyyy-mm-dd') <= $5`;
                param = ['view', 'Merchant', data.merchantId, data.startDate, data.nowDate];        
                break;
            case "Catalogue":
                query = `SELECT count(id) as qty from "Visits" WHERE type = $1 and "visitableType" = $2 and "ownerId" = $3 and to_char("createdAt",'yyyy-mm-dd') >= $4  and to_char("createdAt",'yyyy-mm-dd') <= $5`;
                param = ['click', 'Product', data.merchantId, data.startDate, data.nowDate];
                break;
            case "breakDownProfile":
                query = `SELECT to_char("createdAt",'yyyy-mm-dd') as days, count(id) as qty from "Visits" WHERE type = $1 and "visitableType" = $2 and "ownerId" = $3 and to_char("createdAt",'yyyy-mm-dd') >= $4  and to_char("createdAt",'yyyy-mm-dd') <= $5 group by to_char("createdAt",'yyyy-mm-dd')`;
                param = ['view', 'Merchant', data.merchantId, data.startDate, data.nowDate];        
                break;
            case "merchantLink":
                // query = `SELECT ml.id, ml.name, count(v.id) as qty from "Visits" v, "MerchantLinks" ml
                // WHERE v."visitableId"=ml.id and v.type = $1 and v."visitableType" = $2 and v."ownerId" = $3 and to_char(v."createdAt",'yyyy-mm-dd') >= $4  and to_char(v."createdAt",'yyyy-mm-dd') <= $5 group by ml.id, ml.name order by count(v.id) desc `;
                // param = ['click', 'MerchantLink', data.merchantId, data.startDate, data.nowDate];
                query = `select ml.id,ml.name, case when qty is null then 0 else qty end as qty from "MerchantLinks" ml left outer join (SELECT ml.id, ml.name, count(v.id) as qty from "Visits" v, "MerchantLinks" ml
                WHERE v."visitableId"=ml.id and v.type = $1 and v."visitableType" = $2 and v."ownerId" = $3 and to_char(v."createdAt",'yyyy-mm-dd') >= $4  and to_char(v."createdAt",'yyyy-mm-dd') <= $5 group by ml.id, ml.name) tmp on ml.id=tmp.id where ml."merchantId"=$6 order by qty desc  `;
                param = ['click', 'MerchantLink', data.merchantId, data.startDate, data.nowDate, data.merchantId,];
                break;
            case "Product":
                // query = `SELECT p.id, p.name, count(v.id) as qty from "Visits" v, "Products" p
                // WHERE v."visitableId"=p.id and v.type = $1 and v."visitableType" = $2 and v."ownerId" = $3 and to_char(v."createdAt",'yyyy-mm-dd') >= $4  and to_char(v."createdAt",'yyyy-mm-dd') <= $5 group by p.id, p.name order by count(v.id) desc `;
                // param = ['click', 'Product', data.merchantId, data.startDate, data.nowDate];
                query = `select p.id,p.name, case when qty is null then 0 else qty end as qty from "Products" p left outer join (SELECT p.id, p.name, count(v.id) as qty from "Visits" v, "Products" p
                WHERE v."visitableId"=p.id and v.type = $1 and v."visitableType" = $2 and v."ownerId" = $3 and to_char(v."createdAt",'yyyy-mm-dd') >= $4  and to_char(v."createdAt",'yyyy-mm-dd') <= $5 group by p.id, p.name) tmp on p.id=tmp.id where p."merchantId"=$6 order by qty desc `;
                param = ['click', 'Product', data.merchantId, data.startDate, data.nowDate, data.merchantId];
                break;
            default:
                break;
        }

        
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
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
        console.log('Error getVisit ==> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

exports.getCategory = function (data) {
    return new Promise(async function (resolve, reject) {
        var gep = '';
        try {
            if(data.profile) {
                data.merchantId = data.profile.merchantId;
            }
            let gp = await getCategoryMaster(data);
            resolve(gp);
        } catch (e) {
            console.log('Error get category ultipage => ', e)
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

async function getCategoryMaster(data) {
    try {
        var wh='';
        if (data.id) {
            wh=" where id="+data.id
        }
        query = 'SELECT id,name,"imageUrl" FROM "Categories" '+wh;

        exc = await pgCon.query(query);
        if (exc.rowCount > 0) {
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
        console.log('Error get category master ==> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}
exports.getSubCategory = function (data) {
    return new Promise(async function (resolve, reject) {
        var gep = '';
        try {
            if(data.profile){
                data.merchantId = data.profile.merchantId;
            }
            let gp = await getSubCategoryMaster(data);
            resolve(gp);
        } catch (e) {
            console.log('Error get sub category ultipage => ', e)
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

async function getSubCategoryMaster(data) {
    console.log('getSubCategoryMaster =>',data)
    try {
        var wh='';
        if (data.id) {
            wh += ' and id='+data.id
        }
        if (data.categoryId) {
            wh +=' and "categoryId"='+data.categoryId
        }

        query = 'SELECT id,"categoryId", name,"imageUrl" FROM "SubCategories" where id is not null '+wh;
        console.log('query =>',query)
        exc = await pgCon.query(query);
        if (exc.rowCount > 0) {
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
        console.log('Error get sub category master ==> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}
exports.postMerchantCategory = function (data) {
    return new Promise(async function (resolve, reject) {
        let link = '';
        try {
            data.merchantId = data.profile.merchantId;
            link = await saveMerchantCategory(data);
            resolve(link);
        } catch (e) {
            console.log('Error post merchantSubCategory => ', e)
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

async function saveMerchantCategory(data) {
    console.log('saveMerchantCategory =>',data)
    try {
        query = 'delete from "MerchantCategory" where "merchantId" = $1'
        param = [data.merchantId];
        exc = await pgCon.query(query, param);
        
        query = 'INSERT INTO "MerchantCategory" ("merchantId","categoryId") VALUES ($1,$2)'
        param = [data.merchantId, data.id];
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
        console.log('Error create link page ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}
exports.postMerchantSubCategory = function (data) {
    return new Promise(async function (resolve, reject) {
        let link = '';
        try {
            data.merchantId = data.profile.merchantId;
            link = await saveMerchantSubCategory(data);
            resolve(link);
        } catch (e) {
            console.log('Error post merchantSubCategory => ', e)
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

async function saveMerchantSubCategory(data) {
    console.log('saveMerchantSubCategory =>',data)
    try {
        query = 'delete from "MerchantSubCategory" where "merchantId" = $1'
        param = [data.merchantId];
        exc = await pgCon.query(query, param);
        
        query = 'INSERT INTO "MerchantSubCategory" ("merchantId","subCategoryId") VALUES ($1,$2)'
        param = [data.merchantId, data.id];
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
        console.log('Error create link page ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}
async function getCategoryMerchant(data) {
    try {
        query = 'SELECT "categoryId" FROM "MerchantCategory" WHERE "merchantId" = $1';
        param = [data.merchantId];
        console.log('query =>',query)
        console.log('param =>',param)
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
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
        console.log('error getCategoryMerchant ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}
async function getSubCategoryMerchant(data) {
    try {
        query = 'SELECT "subCategoryId" FROM "MerchantSubCategory" WHERE "merchantId" = $1';
        param = [data.merchantId];
        console.log('query =>',query)
        console.log('param =>',param)
        exc = await pgCon.query(query, param);
        if (exc.rowCount > 0) {
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
        console.log('error getCategoryMerchant ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}
exports.dateToString = function (date) {
    return new Promise(async function (resolve, reject) {
        try {
            let gs = await dateToString(date);
            resolve(gs);
        } catch (e) {
            console.log('Error dateToString => ', e)
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}
async function dateToString(date) {
    try {
        // var date = new Date();
        var day = date.getDate();
        var year = date.getFullYear();
        var thirtyMonth = parseInt(date.getMonth()) + 1;
        let tmpMonth = ("0" + thirtyMonth).slice(-2);
        let tmpDay = ("0" + day).slice(-2);
        var dts = year + "-" + tmpMonth + "-" + tmpDay;
        return dts;

    } catch (e) {
        console.log('error getCategoryMerchant ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}
exports.getMerchant = function (data) {
    // console.log('getPage data=>',data)
    return new Promise(async function (resolve, reject) {
        try {
            let gpm = await getMerchant(data);
            // console.log('getMerchant =>',gpm)
            resolve(gpm);
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

async function getMerchant(data) {
    console.log('getMerchant data =>',data)
    try {
        var p = {}, oId = {}, oName = {}, oPhone = {}, oEmail = {}

        if (data.id) {
            oId = {'merchantId': data.id}
        }
        if (data.name) {
            oName = {'fullname': new RegExp('.*' + data.name + '.*')}
        }
        
        if (data.phone) {
            oPhone = {'phone': data.phone}
        }
        if (data.email) {
            oEmail = {'email': data.email}
        }
        var param = extend({}, oId, oName, oPhone, oEmail);

        console.log('pppppp =>',param)

        let limit = "";
        let offset = 0;
        if (!data.limit) data.limit = 50;
        if (!data.page) data.page = 0;
        if (data.limit) {
            if (data.page) {
                data.page -= 1;
                offset = data.page * data.limit;
            }
            limit += `limit ${data.limit} offset ${offset}`;
            console.log('limit atas =>',limit)
            limit = parseInt(data.limit)
        }
        console.log('limit =>',limit)
        offset = parseInt(offset)
        console.log('offset =>',offset)

        mongoose.Promise = global.Promise;
        await mongoose.connect(mongo.mongoDb.url, {
            useNewUrlParser: true
        });
        // let query = await accountSchema.find(p, {merchantId: 1, fullname: 1, email: 1, phoneCode: 1, phone: 1, gender:1, _id: 0 }).skip(offset).limit(limit);
        let query = await accountSchema.find(param, {merchantId: 1, fullname: 1, email: 1, phoneCode: 1, phone: 1, gender:1, _id: 0 }).skip(offset).limit(limit);
        await mongoose.connection.close();

        if (query === null) {
            return ({
                responseCode: process.env.NOTFOUND_RESPONSE,
                responseMessage: "Not found"
            })
        }else{
            var arrData = [], id = '';
            for(const t of query) {
                id = id + "','" + t.merchantId
            }
            id = id+ "'"
            var idIn = id.substring(2);    
            console.log('merchantId =>', idIn);
            var qry = 'SELECT * FROM "Merchants" WHERE id in (' + idIn + ')';
            exc = await pgCon.query(qry);
            if (exc.rowCount > 0) {
                for(const m of query) {
                    var logo = '';
                    for(const p of exc.rows) {
                        if(m.merchantId == p.id) {
                            logo = p.imageUrl;
                        }
                    }
                    if(logo == '') logo = process.env.DEFAULT_IMAGE;
                    arrData.push(    {
                        fullname: m.fullname,
                        email: m.email,
                        phoneCode: m.phoneCode,
                        phone: m.phone,
                        merchantId: m.merchantId,
                        logo: logo
                      })
                }
                if(arrData.length>0) {
                    query = arrData;
                }
            }
            // console.log('arrData =>',arrData)
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: 'Success',
                data: query
            })
        }

    } catch (e) {
        console.log('Error get page merchant ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: 'Internal server error, please try again!'
        })
    }
}
function extend(target) {
    var sources = [].slice.call(arguments, 1);
    sources.forEach(function (source) {
      for (var prop in source) {
        target[prop] = source[prop];
      }
    });
    return target;
}
exports.getMerchantVisit = function (data) {
    // console.log('getPage data=>',data)
    return new Promise(async function (resolve, reject) {
        try {
            let gpm = await getMerchantVisit(data);
            resolve(gpm);
        } catch (e) {
            console.log('Error get visit ultipage => ', e)
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}
async function getMerchantVisit(data) {
    console.log('getMerchantVisit data =>',data)
    try {
        var param = '';
        if(data.filter) {
            var filter = data.filter;
            if(filter.ownerId) {
                param += ` and v."ownerId"='`+filter.ownerId+`'`;
            }
            if(filter.start_date) {
                param += ` and to_char(v."createdAt",'yyyy-mm-dd') >= '`+filter.start_date+`'`;
            }
            if(filter.end_date) {
                param += ` and to_char(v."createdAt",'yyyy-mm-dd') <= '`+filter.end_date+`'`;
            }

        }
        // let limit = "";
        // let offset = 0;
        // if (!filter.limit) filter.limit = 50;
        // if (!filter.page) filter.page = 0;
        // if (filter.limit) {
        //     if (filter.page) {
        //         filter.page -= 1;
        //         offset = filter.page * filter.limit;
        //     }
        //     limit += `limit ${filter.limit} offset ${offset}`;
        //     console.log('limit atas =>',limit)
        //     limit = parseInt(filter.limit)
        // }
        // console.log('limit =>',limit)
        // offset = parseInt(offset)
        // console.log('offset =>',offset)

        var qry = `select "ownerId", "visitableId" as id, ml.name, count(v.id) as qty, 'MerchantLink' as description from "Visits" v, "MerchantLinks" ml where  v."visitableId"=ml.id and v."visitableType" = 'MerchantLink' `+param+` group by "ownerId", "visitableId", ml.name union all
        select "ownerId", "visitableId" as id, p.name, count(v.id) as qty, 'Products' as description 
        from "Visits" v, "Products" p where  v."visitableId"=p.id and v."visitableType" = 'Product' `+param+` group by "ownerId", "visitableId", p.name union all select a."ownerId", ROW_NUMBER () OVER (ORDER BY name) as id, a.name, a.qty, 'Merchant' as description  from (
        select "ownerId", to_char(v."createdAt",'yyyy-mm-dd') as name, count(v.id) as qty from "Visits" v where v."visitableType" = 'Merchant' `+param+` 
        group by "ownerId", to_char(v."createdAt",'yyyy-mm-dd') order by "ownerId", to_char(v."createdAt",'yyyy-mm-dd')) a`;
        console.log('qry =>',qry)
        exc = await pgCon.query(qry);
        if (exc.rowCount > 0) {
            var arrMerchant=[], arrProduct = [], arrLink = [];
            for(const m of exc.rows) {
                var logo = '';
                if(m.description == 'MerchantLink'){
                    arrLink.push({name: m.name, qty: m.qty })
                }else if(m.description == 'Products'){
                    arrProduct.push({name: m.name, qty: m.qty })
                }else if(m.description == 'Merchant') {
                    arrMerchant.push({name: m.name, qty: m.qty })
                }
            }
            var data = [];
            data.push({
                MerchantLink: JSON.stringify(arrLink),
                Products: JSON.stringify(arrProduct),
                Merchant: JSON.stringify(arrMerchant)
            })
            // data.MerchantLink = JSON.stringify(arrLink);
            // data.Products = JSON.stringify(arrProduct);
            // data.Merchant = JSON.stringify(arrMerchant);
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: 'Success',
                data: data
            })
        }else{
            return ({
                responseCode: process.env.NOTFOUND_RESPONSE,
                responseMessage: 'NotFound'
            })
        }
    } catch (e) {
        console.log('Error get page merchant visit ===> ', e);
        notification.sendErrorNotification(e.stack);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: 'Internal server error, please try again!'
        })
    }
}