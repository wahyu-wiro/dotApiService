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
const masterService = require('../service/masterService');
const backendService = require('../service/backendService');
const checking = require('../controllers/check');
const kredential = process.env.KREDENTIAL_KEY;
const Cryptr = require('cryptr');
const fs = require('fs');
const cryptr = new Cryptr(kredential)
// let decode = require('im-decode');
const bufferImage = require("buffer-image");

const driverDivisionId = '9'; //division id driver from postgreq
const asymmetric = require("../config/asymmetric");
var log={}

module.exports.getTemplate = async function getTemplate(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
    let body = {};
    // check signature and token
    isValid = new validator(signature);
    let ct = await check.identifier(token);
    if (await isValid.checkSignature()) {
        if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
            body.profile = ct.data;
            let response = await masterService.getTemplate(body);
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

module.exports.getPage = async function getPage(req, res) {
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

    var pageId = req.swagger.params['id'].value;
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
            if (pageId) {
                body.pageId = pageId;
            }
            let response = await masterService.getPage(body);
            if(response.data){
                var result = await asymmetric.encrypterRsa(
                    JSON.stringify(response.data),
                    clientKey
                );
                result = asymmetric.encryptAes(result, aesKey, aesIv);
                response.data=result;
            }
            if (ct.data.newToken) {
                response.token = ct.data.newToken
            }
            utils.writeJson(res, response);
        } else {
            utils.writeJson(res, ct);
        }
    } else {
        utils.writeJson(res, ct);
        // utils.writeJson(res, {
        //     responseCode: process.env.UNAUTHORIZED_RESPONSE,
        //     responseMessage: "Unauthorize"
        // })
    }
}

module.exports.postPage = async function postPage(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
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
    var pageName = req.swagger.params['pageName'].value;
    var pageDescription = req.swagger.params['pageDescription'].value;
    var catalogue = req.swagger.params['catalogue'].value;
    var bannerImg = req.swagger.params['bannerImg'].value;
    var pageImg = req.swagger.params['pageImg'].value;
    var pageHtml = req.swagger.params['pageHtml'].value;
    var pageId = req.swagger.params['pageId'].value;
    var pageTitle = req.swagger.params['pageTitle'].value;
    var templateName = req.swagger.params['templateName'].value;

    let body = {};
    // check token 
    isValid = new validator(signature);
    let ct = await check.identifier(token);
    if (await isValid.checkSignature()) {
        if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
            body.profile = ct.data;
            body.pageName = pageName;
            body.pageDescription = pageDescription;
            body.catalogue = catalogue;
            body.bannerImg = bannerImg;
            body.pageImg = pageImg;
            body.pageHtml = pageHtml;
            body.pageTitle = pageTitle;

            if (templateName) {
                body.templateName = templateName;
            }
            if (pageId) {
                body.pageId = pageId;
            }
            log.accAddress = req.headers.userIp + '_' + req.headers['user-agent'];
            log.link = req.url;
            log.method = req.method;
            body.log = log
            let response = await masterService.postPage(body);
            console.log('postPage =>',response)
            if (ct.data.newToken) {
                response.token = ct.data.newToken
            }
            utils.writeJson(res, response);
        } else {
            utils.writeJson(res, ct);
        }
    } else {
        utils.writeJson(res, ct);
        // utils.writeJson(res, {
        //     responseCode: process.env.UNAUTHORIZED_RESPONSE,
        //     responseMessage: "Unauthorize"
        // })
    }
}

module.exports.deletePage = async function deletePage(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
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
    let pageId = req.swagger.params['pageId'].value;
    let body = {};
    // check token 
    isValid = new validator(signature);
    let ct = await check.identifier(token);
    if (await isValid.checkSignature()) {
        if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
            body.profile = ct.data;
            body.pageId = pageId;
            log.accAddress = req.headers.userIp + '_' + req.headers['user-agent'];
            log.link = req.url;
            log.method = req.method;
            body.log = log
            let response = await masterService.deletePage(body);
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

module.exports.publishPage = async function publishPage(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
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
    let body = req.swagger.params['body'].value;
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
            let response = await masterService.publishPage(body);
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

module.exports.getSubscription = async function getSubscription(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
    var subId = req.swagger.params['id'].value;
    console.log('token =>',token)
    token = asymmetric.decryptAes(token);
    if (token == false) {
        utils.writeJson(res, {
            responseCode: process.env.NOTACCEPT_RESPONSE,
            responseMessage: "Unable to read token",
        });
        return;
    }
    console.log('token open =>',token)
    signature = asymmetric.decryptAes(signature);
    if (signature == false) {
        utils.writeJson(res, {
            responseCode: process.env.NOTACCEPT_RESPONSE,
            responseMessage: "Unable to read signature",
        });
        return;
    }
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
    let body = {}
    // check token 
    isValid = new validator(signature);
    let ct = await check.identifier(token);
    // console.log('checkToken =>',ct)
    if (await isValid.checkSignature()) {
        if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
            body.profile = ct.data;
            if (subId) {
                body.subscriptionId = subId;
            }
            let response = await masterService.getSubscription(body);
            if(response.data){
                var result = await asymmetric.encrypterRsa(
                    JSON.stringify(response.data),
                    clientKey
                );
                result = asymmetric.encryptAes(result, aesKey, aesIv);
                response.data=result;
            }           
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

module.exports.getProfile = async function getProfile(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
    var param = req.swagger.params['param'].value;
    let body = {};
    // check token 
    let response = await masterService.getProfile(param);
    console.log('getProfile response =>',response)
    utils.writeJson(res, response);
}
module.exports.getRegency = async function getRegency(req, res) {
    // var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
    var param = req.swagger.params['param'].value;
    // var appSignature = req.swagger.params['appSignature'].value;
    let body = {};
    // check token 
    isValid = new validator(signature);
    // let ct = await check.identifier(token);
    let ct = { responseCode: process.env.SUCCESS_RESPONSE } // without token
    if (await isValid.checkSignature()) {
        if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
            body.profile = ct.data;
            body.param = param;
            let response = await backendService.getRegency(body);
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

module.exports.updateProfile = async function updateProfile(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;

    var body = req.swagger.params['body'].value;
    if (req.swagger.params['deviceId'].value) {
        body.deviceId = req.swagger.params['deviceId'].value;
    }
    let response = await masterService.updateProfile(body);
    utils.writeJson(res, response);

}

module.exports.switchItem = async function switchItem(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
    var param = req.swagger.params['switch'].value;
    var category = req.swagger.params['category'].value;
    let body = {};
    // check token 
    isValid = new validator(signature);
    let ct = await check.identifier(token);
    if (await isValid.checkSignature()) {
        if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
            body.profile = ct.data;
            body.switch = param;
            body.category = category;
            let response = await masterService.switchItem(body);
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

module.exports.getProduct = async function getProduct(req, res) {
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

    var productId = req.swagger.params['id'].value;
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
            if (productId) {
                body.productId = productId;
            }
            let response = await masterService.getProduct(body);
            if(response.data){
                var result = await asymmetric.encrypterRsa(
                    JSON.stringify(response.data),
                    clientKey
                );
                console.log('result 1 =>',result);
                result = asymmetric.encryptAes(result, aesKey, aesIv);
                response.data=result;
            }
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

module.exports.postProduct = async function postProduct(req, res) {
    console.log('postProduct')
    let body = {};
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
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
    let img = req.swagger.params['img'].value;
    let name = req.swagger.params['name'].value;
    let description = req.swagger.params['description'].value;
    let price = req.swagger.params['price'].value;
    let discountPrice = req.swagger.params['discountPrice'].value;
    let productId = req.swagger.params['productId'].value;
    let pageId = req.swagger.params['pageId'].value;

    name =  asymmetric.decryptAes(name);
    name = await asymmetric.decrypterRsa(name);
    description =  asymmetric.decryptAes(description);
    description = await asymmetric.decrypterRsa(description);
    price =  asymmetric.decryptAes(price);
    price = await asymmetric.decrypterRsa(price);
    productId =  asymmetric.decryptAes(productId);
    productId = await asymmetric.decrypterRsa(productId);
    pageId =  asymmetric.decryptAes(pageId);
    pageId = await asymmetric.decrypterRsa(pageId);

    // check token 
    isValid = new validator(signature);
    let ct = await check.identifier(token);
    if (await isValid.checkSignature()) {
        if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
            body.profile = ct.data;
            // if (img) {

            // let image = bufferImage(Buffer.from(img.buffer));
            // let result = bufferImage.from(image);
            // console.log('result ======> ',result)

            // base64data = new Buffer(img.buffer).toString('base64');
            // base64data = 'data:image/jpeg;base64,' + Buffer.from(img.buffer).toString('base64')
            // base64data = JSON.stringify(base64data);
            // body.img.push(base64data);
            body.img = img;
            // }

            body.name = name;
            body.description = description;
            body.price = price;
            if (productId) {
                body.productId = productId;
            }
            if (pageId) {
                body.pageId = pageId;
            }
            if (discountPrice) {
                body.discountPrice = discountPrice
            }
            log.accAddress = req.headers.userIp + '_' + req.headers['user-agent'];
            log.link = req.url;
            log.method = req.method;
            body.log = log
            let response = await masterService.postProduct(body);
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

module.exports.deleteProduct = async function deleteProduct(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
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

    var productId = req.swagger.params['productId'].value;
    let body = {};
    // check token 
    isValid = new validator(signature);
    let ct = await check.identifier(token);
    if (await isValid.checkSignature()) {
        if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
            body.profile = ct.data;
            body.productId = productId;
            log.accAddress = req.headers.userIp + '_' + req.headers['user-agent'];
            log.link = req.url;
            log.method = req.method;
            body.log = log
            let response = await masterService.deleteProduct(body);
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

module.exports.getLink = async function getLink(req, res) {
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
    var linkId = req.swagger.params['id'].value;
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
            if (linkId) {
                body.linkId = linkId;
            }
            let response = await masterService.getLink(body);
            if(response.data){
                var result = await asymmetric.encrypterRsa(
                    JSON.stringify(response.data),
                    clientKey
                );
                result = asymmetric.encryptAes(result, aesKey, aesIv);
                response.data=result;
            }
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

module.exports.postLink = async function postLink(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
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
    let body = req.swagger.params['body'].value;
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
            let response = await masterService.postLink(body);
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

module.exports.deleteLink = async function deleteLink(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
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
    var linkId = req.swagger.params['linkId'].value;
    let body = {};
    // check token 
    isValid = new validator(signature);
    let ct = await check.identifier(token);
    if (await isValid.checkSignature()) {
        if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
            body.profile = ct.data;
            body.linkId = linkId;
            log.accAddress = req.headers.userIp + '_' + req.headers['user-agent'];
            log.link = req.url;
            log.method = req.method;
            body.log = log            
            let response = await masterService.deleteLink(body);
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

module.exports.getUrl = async function getUrl(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
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
            let response = await masterService.getUrl(body);
            console.log('response =>',response)
            if(response.data) {
                var result = await asymmetric.encrypterRsa(
                    JSON.stringify(response.data),
                    clientKey
                );
                result = asymmetric.encryptAes(result, aesKey, aesIv);
                response.data=result;
            }

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

module.exports.editUrl = async function editUrl(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
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
    // let aesParam = await asymmetric.decrypterRsa(
    //     req.swagger.params["aes"].value
    // );

    // if (aesParam == false) {
    //     utils.writeJson(res, {
    //         responseCode: process.env.NOTACCEPT_RESPONSE,
    //         responseMessage: "Unable to read aes",
    //     });
    //     return;
    // }
    // let aesKey = aesParam.split(":")[0];
    // let aesIv = aesParam.split(":")[1];

    // let clientKey = req.swagger.params["clientKey"].value;
    // clientKey = asymmetric.decryptAes(clientKey);
    // if (clientKey == false) {
    //     utils.writeJson(res, {
    //         responseCode: process.env.NOTACCEPT_RESPONSE,
    //         responseMessage: "Unable to read clientKey",
    //     });
    //     return;
    // }
    var body = req.swagger.params['body'].value;
    console.log('body 1 =>',body)
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
    console.log('body 2 =>',body)
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
            let response = await masterService.editUrl(body);
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

module.exports.getSeo = async function getSeo(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
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
    // check token 
    var body = {}
    isValid = new validator(signature);
    let ct = await check.identifier(token);
    if (await isValid.checkSignature()) {
        if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
            body.profile = ct.data;
            let response = await masterService.getSeo(body);
            console.log('CT ====> ', ct)
            if(response.data){
                var result = await asymmetric.encrypterRsa(
                    JSON.stringify(response.data),
                    clientKey
                );
                result = asymmetric.encryptAes(result, aesKey, aesIv);
                response.data=result;
            }            
            if (ct.data.newToken) {
                response.token = ct.data.newToken
            }
            utils.writeJson(res, response);
        } else {
            utils.writeJson(res, ct);
        }
    } else {
        utils.writeJson(res, ct);
        // utils.writeJson(res, {
        //     responseCode: process.env.UNAUTHORIZED_RESPONSE,
        //     responseMessage: "Unauthorize"
        // })
    }
}

module.exports.postSeo = async function postSeo(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
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
    let body = req.swagger.params['body'].value;
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
            let response = await masterService.postSeo(body);
            console.log('postSeo =>',response)
            if (ct.data.newToken) {
                response.token = ct.data.newToken
            }
            utils.writeJson(res, response);
        } else {
            utils.writeJson(res, ct);
        }
    } else {
        utils.writeJson(res, ct);        
        // utils.writeJson(res, {
        //     responseCode: process.env.UNAUTHORIZED_RESPONSE,
        //     responseMessage: "Unauthorize"
        // })
    }
}

module.exports.getPaymentMethod = async function getPaymentMethod(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
    var param = req.swagger.params['param'].value;
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
            body.param=param;
            let response = await masterService.getPaymentMethod(body);
            if(response.data){
                var result = await asymmetric.encrypterRsa(
                    JSON.stringify(response.data),
                    clientKey
                );
                result = asymmetric.encryptAes(result, aesKey, aesIv);
                response.data=result;
            }            
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

module.exports.uploadImage = async function uploadImage(req, res) {
    let body = {};
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
    let img = req.swagger.params['img'].value;
    let behalf = req.swagger.params['behalf'].value;
    // check token 
    isValid = new validator(signature);
    let ct = await check.identifier(token);
    if (await isValid.checkSignature()) {
        if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
            body.profile = ct.data;
            body.img = img;
            body.behalf = behalf;
            let response = await masterService.uploadImage(body);
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

module.exports.getInsight = async function getInsight(req, res) {
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
            let response = await masterService.getInsight(body);
            // console.log('getInsight =>',response)
            if(response.data){
                var result = await asymmetric.encrypterRsa(
                    JSON.stringify(response.data),
                    clientKey
                );
                result = asymmetric.encryptAes(result, aesKey, aesIv);
                response.data=result;
            }
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
module.exports.getCategory = async function getCategory(req, res) {
    var apiService = req.swagger.params['apiService'].value;
    if(apiService) {
        let response = await masterService.getCategory({});
        return utils.writeJson(res, response);
    }
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
            let response = await masterService.getCategory(body);
            if(response.data){
                var result = await asymmetric.encrypterRsa(
                    JSON.stringify(response.data),
                    clientKey
                );
                console.log('result 1 =>',result);
                result = asymmetric.encryptAes(result, aesKey, aesIv);
                response.data=result;
            }
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
module.exports.getSubCategory = async function getSubCategory(req, res) {
    let body = {};

    var id = req.swagger.params['id'].value;
    var categoryId = req.swagger.params['categoryId'].value;

    var apiService = req.swagger.params['apiService'].value;
    if(apiService) {
        if (categoryId) {
            body.categoryId = categoryId;
        }
        if (id) {
            body.id = id;
        }
        let response = await masterService.getSubCategory(body);
        return utils.writeJson(res, response);
    }

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
    // check token 
    isValid = new validator(signature);
    let ct = await check.identifier(token);
    if (await isValid.checkSignature()) {
        if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
            body.profile = ct.data;
            if (categoryId) {
                body.categoryId = categoryId;
            }
            if (id) {
                body.id = id;
            }

            let response = await masterService.getSubCategory(body);
            if(response.data){
                var result = await asymmetric.encrypterRsa(
                    JSON.stringify(response.data),
                    clientKey
                );
                console.log('result 1 =>',result);
                result = asymmetric.encryptAes(result, aesKey, aesIv);
                response.data=result;
            }
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
module.exports.postMerchantCategory = async function postMerchantCategory(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
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
    let body = req.swagger.params['body'].value;
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
    // check token 
    isValid = new validator(signature);
    let ct = await check.identifier(token);
    if (await isValid.checkSignature()) {
        if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
            body.profile = ct.data;
            let response = await masterService.postMerchantCategory(body);
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
module.exports.postMerchantSubCategory = async function postMerchantSubCategory(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
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
    let body = req.swagger.params['body'].value;
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
    // check token 
    isValid = new validator(signature);
    let ct = await check.identifier(token);
    if (await isValid.checkSignature()) {
        if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
            body.profile = ct.data;
            let response = await masterService.postMerchantSubCategory(body);
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
module.exports.getMerchant = async function getMerchant(req, res) {
    var apiService = req.swagger.params['apiService'].value;
    var param = req.swagger.params['param'].value;
    if (checking.isValidService(apiService)) {
        if(param) {param = JSON.parse(param) }else{param={}}
        let response = await masterService.getMerchant(param);
        // console.log('getMerchant =>',response)
        return utils.writeJson(res, response);
    }

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
    var linkId = req.swagger.params['id'].value;
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
            let response = await masterService.getMerchant(body);
            if(response.data){
                var result = await asymmetric.encrypterRsa(
                    JSON.stringify(response.data),
                    clientKey
                );
                result = asymmetric.encryptAes(result, aesKey, aesIv);
                response.data=result;
            }
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
module.exports.getMerchantVisit = async function getMerchantVisit(req, res) {
    var apiService = req.swagger.params['apiService'].value;
    var param = req.swagger.params['param'].value;
    let body = {};
    if (checking.isValidService(apiService)) {
        if(param) {body.filter = JSON.parse(param) }
        console.log('getMerchantVisit param =>',param)
        let response = await masterService.getMerchantVisit(body);
        console.log('getMerchantVisit =>',response)
        return utils.writeJson(res, response);
    }

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
    if(param) {
        param = asymmetric.decryptAes(param);
        if (!param) {
          utils.writeJson(res, {
            responseCode: process.env.NOTACCEPT_RESPONSE,
            responseMessage: "Unable to read param",
          });
          return;
        }
        console.log('param =>',param)
        body.filter = JSON.parse(param);
      }    
    // check token 
    isValid = new validator(signature);
    let ct = await check.identifier(token);
    if (await isValid.checkSignature()) {
        if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
            body.profile = ct.data;
            let response = await masterService.getMerchantVisit(body);
            if(response.data){
                var result = await asymmetric.encrypterRsa(
                    JSON.stringify(response.data),
                    clientKey
                );
                result = asymmetric.encryptAes(result, aesKey, aesIv);
                response.data=result;
            }
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