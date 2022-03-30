'use strict';

var utils = require('../utils/writer.js');
var apiService = require('../service/apiService');
let isValid = '';
const asym = require('../config/asymmetric');
// var arrStatus = ['Pending', 'Assign', 'Pick up', 'On Delivery', 'Delivered'];
var arrStatus = ['Pending', 'Assigned', 'Pickup', 'Delivering', 'Delivered', 'Cancelled'];
var arrService = ['sameDay', 'priority'];
const validator = require('../class/validator');
const accountService = require('../service/accountService');
const backendService = require('../service/backendService');
const checking = require('../controllers/check');

const driverDivisionId = '9'; //division id driver from postgreq

// validator for signature and token

module.exports.accountPost = async function accountPost(req, res, next) {
  try {
    var signature = req.swagger.params["signature"].value;
    var version = req.swagger.params["v"].value;
    var token = req.swagger.params["token"].value;
    var flowEntry = req.swagger.params["flowEntry"].value;
    // var data = req.swagger.params["body"].value;
    let photo = req.swagger.params["photo"].value;
    let cardImage = req.swagger.params["cardImage"].value;
    let data = {
      email: req.swagger.params["email"].value,
      password: req.swagger.params["password"].value,
      fullName: req.swagger.params["fullName"].value,
      company: req.swagger.params["company"].value,
      deviceId: req.swagger.params["deviceId"].value,
      phoneCode: req.swagger.params["phoneCode"].value,
      phone: req.swagger.params["phone"].value,
      id_number: req.swagger.params["id_number"].value,
      vehicleInfo: req.swagger.params["vehicleInfo"].value
    }
    console.log('accountPost param =>', {'token =>' : token, 'signature =>' : signature})

    isValid = new validator(signature, token);

    data = await isValid.decryptObjectData(data);
    // console.log("data::", data);
    if (!data) {
      return utils.writeJson(res, {
        responseCode: 406,
        responseMessage: "Unable to read data"
      })
    }
    switch (version) {
      case 2:
        break;
      default:
        // call signature validator
        // if (await isValid.checkSignature()) {
        if (await isValid.checkSignature() && await isValid.checkToken()) {
          var profile='', pAccount='';
          let userData = await isValid.getData();
          console.log('userData =>',userData)
          userData = await accountService.getData(userData);
          console.log('userData 2 =>',userData)
          if (userData.responseCode == process.env.SUCCESS_RESPONSE) {
            var profile = {
              email: userData.data[0].employee_email,
              phone: userData.data[0].employee_phone,
              employee_id: userData.data[0].employee_id,
            }
          }
          console.log("profile =>", profile);          

          if (flowEntry == 'ultisend') {
            data.division_id = driverDivisionId //driver
            data.id_type = 'k'
          }
          data.signature = "null";
          data.scopes = "null";
          data.roles = "null";
          data.accountPriority = "employee";
          data.appId = isValid.appId;
          data.userType = "ultisend";
          data.company_profile_id = data.company;
          console.log("data::", data);
          let regis = await accountService.register(data);
          console.log("regis::", regis);
          if (regis.responseCode != process.env.SUCCESS_RESPONSE) {
            return utils.writeJson(res, regis);
          }
          let body = {
            'phoneCode': data.phoneCode,
            'phone': data.phone,
            'accountCategory': 'employee',
            'confirmationStatus': '0',
            'company_profile_id': data.company,
            'division_id': driverDivisionId,
          }
          console.log("body::", body);
          let dataTemp = await accountService.getDataTemp(body);
          console.log("dataTemp::", dataTemp);
          if (dataTemp.responseCode != process.env.SUCCESS_RESPONSE) {
            return utils.writeJson(res, dataTemp);
          }
          body = {
            "phone": data.phone,
            'phoneCode': data.phoneCode,
            'accountPriority': dataTemp.data[0].accountCategory,
            'otpCode': dataTemp.data[0].confirmationCode,
            'category': "confirm",
            'profile': profile,
          };
          let dataConfirm = await accountService.confirmDataEmployee(body);
          console.log("dataConfirm::", dataConfirm);
          if (dataConfirm.responseCode != process.env.SUCCESS_RESPONSE) {
            return utils.writeJson(res, dataConfirm);
          }
          userData = await accountService.getData(body);
          console.log("userData::", userData);
          if (userData.responseCode != process.env.SUCCESS_RESPONSE) {
            return utils.writeJson(res, userData);
          }
          body = {
            ownerId: userData.data[0].employee_id,
            scope: 'profile',
            behalf: 'ultisend',
            file: photo
          }
          photo = await backendService.uploadFile(body);
          // console.log("photo::", photo);
          body = {
            ownerId: userData.data[0].employee_id,
            scope: 'cardImage',
            behalf: 'ultisend',
            file: cardImage
          }
          cardImage = await backendService.uploadFile(body);
          // console.log("cardImage::", cardImage);

          body = {
            "driverId": userData.data[0].employee_id,
            "driverName": userData.data[0].employee_name,
            "driverPhone": data.phoneCode + userData.data[0].employee_phone,
            "driverAddress": userData.data[0].employee_address,
            "driverEmail": userData.data[0].employee_email,
            "driverVehicleInfo": dataTemp.data[0].vehicleInfo,
            "driverImage": photo.data[0].path,
            "cardImage": cardImage.data[0].path,
            "driverStatus": 'off'
          }
          console.log("body::", body);
          let result = await apiService.postDriver(body);
          pAccount = {
            "company_id": userData.data[0].company_id,
            "company_name": userData.data[0].company_name,
            "employee_id": userData.data[0].employee_id,
            "employee_name": userData.data[0].employee_name,
            "auth_id": userData.data[0].auth_id,
            "division_id": userData.data[0].division_id,
            "division_name": userData.data[0].division_name,
            "employee_phone": userData.data[0].employee_phone,
            "employee_email": userData.data[0].employee_email
          }            
          console.log("pAccount =>", pAccount);
          let pa = await apiService.postAccount(pAccount);
          console.log('postAccount =>',pa)

          // console.log("result::", result);
          utils.writeJson(res, result);
        } else {
          utils.writeJson(res, {
            responseCode: 401,
            responseMessage: "Unauthorize"
          })
        }
        break;
    }
  } catch (e) {
    console.log('Error accountPost => ', e);

    utils.writeJson(res, {
      responseCode: process.env.ERRORINTERNAL_RESPONSE,
      responseMessage: "Internal server error, please try again!"
    })
  }    
};

module.exports.accountGet = async function accountGet(req, res){
  var signature = req.swagger.params["signature"].value;
  var version = req.swagger.params["v"].value;
  var token = req.swagger.params["token"].value;
  let clientKey = req.swagger.params['clientKey'].value;
  let category = req.swagger.params['category'].value;
  let authorization = req.swagger.params['authorization'].value;
  let flowEntry = req.swagger.params['flowEntry'].value;
  let body = {};
  // var data = req.swagger.params["body"].value;
  console.log("category::", category);
  console.log("flowEntry::", flowEntry);
  isValid = new validator(signature, token, authorization);
  if (await isValid.checkSignature() && await isValid.checkToken()) {
    let data = await isValid.getData();
    console.log("data data::", data);
    // data = await accountService.getData(data);
    data = await accountService.getDataAccount(data);
    console.log("accountGet data::", data);
    if (data.responseCode != process.env.SUCCESS_RESPONSE) {
      return utils.writeJson(res, data);
    }

    // if (category == "temp") {
    //   body = {
    //     'confirmationStatus': '0',
    //     'company_profile_id': data.data[0].company_id,
    //     'division_id': driverDivisionId,
    //   }
    //   data = await accountService.getDataTemp(body);
    //   console.log("accountGet =>",data);
    // }
    if (data.data && flowEntry == 'ultisend') {
      console.log("data::", data);
      data.data = await asym.encryptArrayObjectRsa(data.data, clientKey);
    }
    utils.writeJson(res, data);
  }
  else{
    utils.writeJson(res, {
      responseCode: 401,
      responseMessage: "Unauthorize"
    });
  }
}

module.exports.accountUpdate = async function accountUpdate(req, res){
  console.log("accountUpdate: ");
  var signature = req.swagger.params["signature"].value;
  var version = req.swagger.params["v"].value;
  var token = req.swagger.params["token"].value;
  let data = req.swagger.params["body"].value;

  isValid = new validator(signature, token);
  data = await isValid.decryptObjectData(data);
  if (!data) {
    return utils.writeJson(res, {
      responseCode: 406,
      responseMessage: "Unable to read data"
    })
  }
  if (await isValid.checkSignature() && await isValid.checkToken()) {
    if (data.confirmation == "yes") {
      let userData = await isValid.getData();
      userData = await accountService.getData(userData);
      if (userData.responseCode != process.env.SUCCESS_RESPONSE) {
        return utils.writeJson(res, userData);
      }
      let body = {
        'phoneCode': data.phoneCode,
        'phone': data.phone,
        'accountCategory': 'employee',
        'confirmationStatus': '0',
        'company_profile_id': userData.data[0].company_id,
        'division_id': driverDivisionId,
      }
      let dataTemp = await accountService.getDataTemp(body);
      if (dataTemp.responseCode != process.env.SUCCESS_RESPONSE) {
        return utils.writeJson(res, dataTemp);
      }
      console.log("dataTemp::", dataTemp);
      body = {
        "phone": data.phone,
        'phoneCode': data.phoneCode,
        'accountPriority': dataTemp.data[0].accountCategory,
        'otpCode': dataTemp.data[0].confirmationCode,
        'category': "confirm",
      };
      let dataConfirm = await accountService.confirmDataEmployee(body);
      utils.writeJson(res, dataConfirm);
      userData = await accountService.getData(body);
      body = {
        "driverId": userData.data[0].employee_id,
        "driverName": userData.data[0].employee_name,
        "driverPhone": userData.data[0].employee_phone,
        "driverAddress": userData.data[0].employee_address,
        "driverEmail": userData.data[0].employee_email,
        "driverVehicleInfo": dataTemp.data[0].vehicleInfo,
        "driverImage": userData.data[0].employee_profile_img,
        "driverStatus": 'off'
      }
      console.log("body::", body);
      let result = await apiService.postDriver(body);
      console.log("result::", result);
      body = {
        "company_id": userData.data[0].company_id,
        "company_name": userData.data[0].company_name,
        "employee_id": userData.data[0].employee_id,
        "employee_name": userData.data[0].employee_name,
        "auth_id": userData.data[0].auth_id,
        "division_id": userData.data[0].division_id,
        "division_name": userData.data[0].division_name,
        "employee_phone": userData.data[0].employee_phone,
        "employee_email": userData.data[0].employee_email
  }
      let pa = await apiService.postAccount(body);

    }
    else if(data.confirmation == "no"){
      let body = {
        "phone": data.phone,
        'phoneCode': data.phoneCode,
        'accountPriority': 'employee',
        'otpCode': "no",
        'category': "confirm",
      };
      console.log("confirmDataEmployee body::", body);
      let dataConfirm = await accountService.confirmDataEmployee(body);
      utils.writeJson(res, dataConfirm);
    }
    else {
      utils.writeJson(res, {
        responseCode: 406,
        responseMessage: "unaccepted"
      });
    }
  }
  else{
    utils.writeJson(res, {
      responseCode: 401,
      responseMessage: "Unauthorize"
    });
  }
}

module.exports.companyGet = async function companyGet(req, res){
  var signature = req.swagger.params["signature"].value;
  var version = req.swagger.params["v"].value;
  let clientKey = req.swagger.params['clientKey'].value;
  var data;

  isValid = new validator(signature);
  if (isValid.checkSignature()) {
    data = await accountService.getCompany({});
    if (data.data) {
      data.data = await asym.encryptArrayObjectRsa(data.data, clientKey);
    }
    utils.writeJson(res, data);
  }
  else{
    utils.writeJson(res, {
      responseCode: 401,
      responseMessage: "Unauthorize"
    });
  }
}

module.exports.postOrder = async function postOrder(req, res, next) {
  var signature = req.swagger.params["signature"].value;
  var version = req.swagger.params["v"].value;
  var data = req.swagger.params["body"].value;
  // console.log('data =>',data)
  // isValid = new validator(signature, token);

  // var service = req.swagger.params['service'].value;
  // if (!service) {
  //     utils.writeJson(res, {
  //         responseCode: process.env.WRONGINPUT_RESPONSE,
  //         responseMessage: "service type is required",
  //     });
  //     return;
  // } else {
  //     if (arrService.indexOf(service) < 0) {
  //         utils.writeJson(res, {
  //             responseCode: process.env.WRONGINPUT_RESPONSE,
  //             responseMessage: "Please insert service with sameDay, priority",
  //         });
  //         return;
  //     }
  // }

  // let result = false;
  // let keys = Object.keys(data);
  // for (let key of keys) {
  //   //   data[key] = asim.decryptAes(data[key]);
  //   data[key] = await asym.decrypterRsa(data[key]);
  //   if (!data[key]) {
  //     result = {
  //         responseCode: process.env.NOTACCEPT_RESPONSE,
  //         responseMessage: "Unable to read " + key,
  //     };
  //     break;
  //   }
  // }

  // console.log('data =>', data);
  // if (result) {
  //     utils.writeJson(res, result);
  //     return;
  // }

  if (!data.orderCode) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "orderCode is required",
      });
      return;
  }
  if (!data.serviceName) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "serviceName is required",
      });
      return;
  } else {
      if (arrService.indexOf(data.serviceName) < 0) {
          utils.writeJson(res, {
              responseCode: process.env.WRONGINPUT_RESPONSE,
              responseMessage: "Please insert service with sameDay, priority",
          });
          return;
      }
  }
  if (!data.merchantName) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "merchantName is required",
      });
      return;
  }
  if (!data.merchantAddress) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "merchantAddress is required",
      });
      return;
  }
  if (!data.merchantPhone) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "merchantPhone is required",
      });
      return;
  }
  if (!data.receiverName) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "receiverName is required",
      });
      return;
  }
  if (!data.receiverAddress) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "receiverAddress is required",
      });
      return;
  }
  if (!data.receiverPhone) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "receiverPhone is required",
      });
      return;
  }
  if (!data.orderItem) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "orderItem is required",
      });
      return;
  }
  if (!data.secretKey) {
    utils.writeJson(res, {
        responseCode: process.env.WRONGINPUT_RESPONSE,
        responseMessage: "secretKey is required",
    });
    return;
  }
  if (!data.userCreated) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "userCreated is required",
      });
      return;
  }

  switch (version) {
    case 2:
      break;
    default:
      // call signature validator
      // if (await isValid.checkSignature() && await isValid.checkToken()) {
      // let cs = await checking.checkSignature(signature);
      let cs = await checking.checkSecretKey(signature);
      if (cs.responseCode == process.env.SUCCESS_RESPONSE) {
        
        data.status='pending';
        data.profile=cs.data;
        data.profile.accAddress = req.headers.userIp + '_' + req.headers['user-agent'];
        data.profile.link = req.url;
        data.profile.method = req.method;
        //get dataAccount
        var p = {
          'phoneCode': cs.data.phoneCode,
          'phone': cs.data.phone,
          'email': cs.data.email,
          'accountCategory': 'employee'
        }
        // let gda = await accountService.getDataTemp(p);
        let gda = await accountService.getDataAccount(p);

        console.log("get Data Employe =>", gda.responseCode);
        if(gda.responseCode == process.env.SUCCESS_RESPONSE){
          data.profile.employee_id = gda.data[0].employee_id;
        }

        apiService
          .postOrder(data)
          .then(function (response) {
            utils.writeJson(res, response);
          })
          .catch(function (response) {
            utils.writeJson(res, response);
          });
      }
      else{
        utils.writeJson(res, {
          responseCode: 401,
          responseMessage: "Unauthorize"
        });
      }
      break;
  }
};

module.exports.putOrder = async function putOrder(req, res, next) {
  var signature = req.swagger.params["signature"].value;
  var version = req.swagger.params["v"].value;
  var data = req.swagger.params["body"].value;
  if (!data.orderCode) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "orderCode is required",
      });
      return;
  }

  if (!data.status) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "status is required",
      });
      return;
  }

  switch (version) {
    case 2:
      break;
    default:
      // let cs = await checking.checkSignature(signature);
      let cs = await checking.checkSecretKey(signature);
      if (cs.responseCode == process.env.SUCCESS_RESPONSE) {
        data.profile=cs.data;
        data.profile.accAddress = req.headers.userIp + '_' + req.headers['user-agent'];
        data.profile.link = req.url;
        data.profile.method = req.method;

        apiService
          .putOrder(data)
          .then(function (response) {
            utils.writeJson(res, response);
          })
          .catch(function (response) {
            utils.writeJson(res, response);
          });
      }
      else{
        utils.writeJson(res, {
          responseCode: 401,
          responseMessage: "Unauthorize"
        });
      }
      break;
  }
};

module.exports.assignOrderPost = async function assignOrderPost(req, res, next) {
  var signature = req.swagger.params["signature"].value;
  var version = req.swagger.params["v"].value;
  var token = req.swagger.params["token"].value;
  var data = req.swagger.params["body"].value;

  isValid = new validator(signature, token);

  let result = false;
  let keys = Object.keys(data);
  for (let key of keys) {
    //   data[key] = asim.decryptAes(data[key]);
    data[key] = await asym.decrypterRsa(data[key]);
    if (!data[key]) {
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
  console.log('data assignOrderPost =>', data);

  if (!data.orderId) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "orderId is required",
      });
      return;
  }
  if (!data.driverId) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "driverId is required",
      });
      return;
  }
  if (!data.driverName) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "driverName is required",
      });
      return;
  }

  if (!data.userCreated) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "userCreated is required",
      });
      return;
  }


  switch (version) {
    case 2:
      break;
    default:
      // call signature validator
      if (await isValid.checkSignature() && await isValid.checkToken()) {
        // data.serviceName=service;
        data.status='Assign';
        let profile = await isValid.getData();
        // var gas = await accountService.getData(profile);
        var gas = await accountService.getDataAccount(profile);
        if(gas.responseCode == process.env.SUCCESS_RESPONSE) {
          profile.id = gas.data[0].employee_id
        }
        data.profile = profile;
        apiService
          .assignOrderPost(data)
          .then(function (response) {
            utils.writeJson(res, response);
          })
          .catch(function (response) {
            utils.writeJson(res, response);
          });
      }
      else{
        utils.writeJson(res, {
          responseCode: 401,
          responseMessage: "Unauthorize"
        });
      }
      break;
  }
};

module.exports.assignOrderUpdate = async function assignOrderUpdate(req, res, next) {
  // let buff = new Buffer('Njg6cmVnaW5hOjYyODIxNDMwNTg1Njc=', 'base64');
  // let text = buff.toString('ascii');
  // var arr_text = text.split(":");
  // var orderId = arr_text[0]
  // console.log('orderId =>',arr_text, ' -- ',orderId)

  var signature = req.swagger.params["signature"].value;
  var version = req.swagger.params["v"].value;
  var token = req.swagger.params["token"].value;
  var data = req.swagger.params["body"].value;

  isValid = new validator(signature, token);

  let result = false;
  let keys = Object.keys(data);
  for (let key of keys) {
    //   data[key] = asim.decryptAes(data[key]);
    data[key] = await asym.decrypterRsa(data[key]);
    if (!data[key]) {
      result = {
          responseCode: process.env.NOTACCEPT_RESPONSE,
          responseMessage: "Unable to read " + key,
      };
      break;
    }
  }

  console.log('data =>', data);
  if (result) {
      utils.writeJson(res, result);
      return;
  }

  if (!data.orderId) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "orderId is required",
      });
      return;
  }
  if (!data.driverId) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "driverId is required",
      });
      return;
  }
  if (!data.status) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "status is required",
      });
      return;
  }else{
    if (arrStatus.indexOf(data.status) < 0) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "Please insert service with 'Pending', 'Assigned', 'Pickup', 'Delivering', 'Delivered', 'Cancelled'",
      });
      return;
    }
  }
  if (!data.userCreated) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "userCreated is required",
      });
      return;
  }


  switch (version) {
    case 2:
      break;
    default:
      // call signature validator
      if (await isValid.checkSignature() && await isValid.checkToken()) {
        let profile = await isValid.getData();
        // var gas = await accountService.getData(profile);
        var gas = await accountService.getDataAccount(profile);
        if(gas.responseCode == process.env.SUCCESS_RESPONSE) {
          profile.id = gas.data[0].employee_id
        }
        data.profile = profile;        
        apiService
          .assignOrderUpdate(data)
          .then(function (response) {
            utils.writeJson(res, response);
          })
          .catch(function (response) {
            utils.writeJson(res, response);
          });
      }
      else{
        utils.writeJson(res, {
          responseCode: 401,
          responseMessage: "Unauthorize"
        });
      }
      break;
  }
};

module.exports.getOrder = async function getOrder(req, res, next) {
  var signature = req.swagger.params["signature"].value;
  var version = req.swagger.params["v"].value;
  var token = req.swagger.params["token"].value;

  let clientKey = req.swagger.params['clientKey'].value;
  console.log('clientKey ye =>',clientKey)

  var param = req.swagger.params["param"].value;
  var service = req.swagger.params["service"].value;
  console.log('param =>',param)
  if(!param) {
    param={}
  }else{
    if(param != "all") {
      param=JSON.parse(param);
      param.serviceName = service;
    }else{
      param={}
    }
  }


  isValid = new validator(signature, token);
  console.log('param =>',param)
  switch (version) {
    case 2:
      break;
    default:
      // call signature validator
      if (await isValid.checkSignature() && await isValid.checkToken()) {
        let data = await isValid.getData();
        param.profile=data;
        param.profile.accAddress = req.headers.userIp + '_' + req.headers['user-agent'];
        param.profile.link = req.url;
        param.profile.method = req.method;

        console.log("data 1::", data);
        // data = await accountService.getData(data);
        // console.log("data 2::", data);
    
        apiService
          .getOrder(param)
          .then(async function (response) {
            if (response.data) {
              response.data = await asym.encryptArrayObjectRsa(response.data, clientKey, [], ['assignId']);
            }
            utils.writeJson(res, response);
          })
          .catch(function (response) {
            utils.writeJson(res, response);
          });
      }
      else{
        utils.writeJson(res, {
          responseCode: 401,
          responseMessage: "Unauthorize"
        });
      }
      break;
  }
};

module.exports.postDriver = async function postDriver(req, res, next) {
  var signature = req.swagger.params["signature"].value;
  var version = req.swagger.params["v"].value;
  var token = req.swagger.params["token"].value;
  var data = req.swagger.params["body"].value;

  isValid = new validator(signature, token);

  let result = false;
  let keys = Object.keys(data);
  for (let key of keys) {
    data[key] = await asym.decrypterRsa(data[key]);
    if (!data[key]) {
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

  if (!data.driverId) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "driverId is required",
      });
      return;
  }
  if (!data.driverName) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "driverName is required",
      });
      return;
  }
  if (!data.driverPhone) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "driverPhone is required",
      });
      return;
  }
  if (!data.driverAddress) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "driverAddress is required",
      });
      return;
  }

  if (!data.driverEmail) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "driverEmail is required",
      });
      return;
  }

  switch (version) {
    case 2:
      break;
    default:
      // call signature validator
      if (await isValid.checkSignature() && await isValid.checkToken()) {
        apiService
          .postDriver(data)
          .then(function (response) {
            utils.writeJson(res, response);
          })
          .catch(function (response) {
            utils.writeJson(res, response);
          });
      }
      else{
        utils.writeJson(res, {
          responseCode: 401,
          responseMessage: "Unauthorize"
        });
      }
      break;
  }
};

module.exports.getDriver = async function getDriver(req, res, next) {
  var token = req.swagger.params["token"].value;
  var signature = req.swagger.params["signature"].value;
  let clientKey = req.swagger.params['clientKey'].value;
  var status = req.swagger.params["status"].value;

  // signature = await asym.decrypterRsa(signature);
  // if (!signature) {
  //     utils.writeJson(res, {
  //         responseCode: process.env.NOTACCEPT_RESPONSE,
  //         responseMessage: "Unable to read signature",
  //     });
  //     return;
  // }

  // clientKey = await asym.decrypterRsa(clientKey);
  // if (!clientKey) {
  //     utils.writeJson(res, {
  //         responseCode: process.env.NOTACCEPT_RESPONSE,
  //         responseMessage: "Unable to read clientKey",
  //     });
  //     return;
  // }
  // console.log('clientKey =>',clientKey)
  let param = {}
  if(status) {param.driverStatus=status}
  isValid = new validator(signature, token);
  var version = 1;
  switch (version) {
    case 2:
      break;
    default:
      // call signature validator
      if (await isValid.checkSignature() && await isValid.checkToken()) {
        apiService
          .getDriver(param)
          .then(async function (response) {
            response.data = await asym.encryptArrayObjectRsa(response.data, clientKey);
            utils.writeJson(res, response);
          })
          .catch(function (response) {
            utils.writeJson(res, response);
          });
      }
      else{
        utils.writeJson(res, {
          responseCode: 401,
          responseMessage: "Unauthorize"
        });
      }
      break;
  }
};

module.exports.putDriver = async function putDriver(req, res, next) {
  var signature = req.swagger.params["signature"].value;
  var version = req.swagger.params["v"].value;
  var token = req.swagger.params["token"].value;
  var data = req.swagger.params["body"].value;
  let serviceCode = req.swagger.params["apiService"].value;

  if (checking.isValidService(serviceCode)) {
    console.log('putDriver =>',data)
    let response = await apiService.putDriver(data);
    return utils.writeJson(res, response);
  }

  isValid = new validator(signature, token);

  // let result = false;
  // let keys = Object.keys(data);
  // for (let key of keys) {
  //   data[key] = await asym.decrypterRsa(data[key]);
  //   if (!data[key]) {
  //     result = {
  //         responseCode: process.env.NOTACCEPT_RESPONSE,
  //         responseMessage: "Unable to read " + key,
  //     };
  //     break;
  //   }
  // }

  // if (result) {
  //     utils.writeJson(res, result);
  //     return;
  // }

  if (!data.driverPhone) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "driverPhone is required",
      });
      return;
  }
  if (!data.driverEmail) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "driverEmail is required",
      });
      return;
  }

  switch (version) {
    case 2:
      break;
    default:
      // call signature validator
      if (await isValid.checkSignature() && await isValid.checkToken()) {
        apiService
          .putDriver(data)
          .then(function (response) {
            utils.writeJson(res, response);
          })
          .catch(function (response) {
            utils.writeJson(res, response);
          });
      }
      else{
        utils.writeJson(res, {
          responseCode: 401,
          responseMessage: "Unauthorize"
        });
      }
      break;
  }
};

module.exports.getDriverOld = async function getDriverOld(req, res, next) {
  var token = req.swagger.params["token"].value;
  var signature = req.swagger.params["signature"].value;
  var secretKey = req.swagger.params["secretKey"].value;
  let clientKey = req.swagger.params['clientKey'].value;
  let aes = req.swagger.params['aes'].value;

  // clientKey = asym.decrypterRsa(clientKey);
  // if (!clientKey) {
  //     utils.writeJson(res, {
  //         responseCode: process.env.NOTACCEPT_RESPONSE,
  //         responseMessage: "Unable to read clientKey",
  //     });
  //     return;
  // }
  // console.log('clientKey =>',clientKey)
  let param = {}
  param.token=token;
  param.signature=signature;
  param.secretKey=secretKey;
  param.clientKey=clientKey;
  param.aes=aes

  isValid = new validator(signature, token);
  var version = 1;
  switch (version) {
    case 2:
      break;
    default:
      // call signature validator
      if (await isValid.checkSignature() && await isValid.checkToken()) {
        apiService
          .getDriverOld(param)
          .then(async function (response) {
            // response.data = await asym.encryptArrayObjectRsa(response.data, clientKey);
            utils.writeJson(res, response);
          })
          .catch(function (response) {
            utils.writeJson(res, response);
          });
      }
      else{
        utils.writeJson(res, {
          responseCode: 401,
          responseMessage: "Unauthorize"
        });
      }
      break;
  }
};

module.exports.createPriority = async function createPriority(req, res, next) {
  var signature = req.swagger.params["signature"].value;
  var version = req.swagger.params["v"].value;
  var data = req.swagger.params["body"].value;
  var token = req.swagger.params["token"].value;
  isValid = new validator(signature, token);

  if (!data.name) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "name is required",
      });
      return;
  }
  if (!data.time) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "time is required",
      });
      return;
  }

  data = await isValid.decryptObjectData(data);
  if (!data) {
    return utils.writeJson(res, {
      responseCode: 406,
      responseMessage: "Unable to read data"
    })
  }

  switch (version) {
    case 2:
      break;
    default:

      if (await isValid.checkSignature() && await isValid.checkToken()) {
        apiService
          .createPriority(data)
          .then(function (response) {
            utils.writeJson(res, response);
          })
          .catch(function (response) {
            utils.writeJson(res, response);
          });
      }
      else{
        utils.writeJson(res, {
          responseCode: 401,
          responseMessage: "Unauthorize"
        });
      }
      break;
  }
};
module.exports.updatePriority = async function updatePriority(req, res, next) {
  var signature = req.swagger.params["signature"].value;
  var version = req.swagger.params["v"].value;
  var data = req.swagger.params["body"].value;
  var token = req.swagger.params["token"].value;
  isValid = new validator(signature, token);
  if (!data._id) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "_id is required",
      });
      return;
  }
  if (!data.name) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "name is required",
      });
      return;
  }
  if (!data.time) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "time is required",
      });
      return;
  }

  data = await isValid.decryptObjectData(data);
  if (!data) {
    return utils.writeJson(res, {
      responseCode: 406,
      responseMessage: "Unable to read data"
    })
  }

  switch (version) {
    case 2:
      break;
    default:

      if (await isValid.checkSignature() && await isValid.checkToken()) {
        apiService
          .updatePriority(data)
          .then(function (response) {
            utils.writeJson(res, response);
          })
          .catch(function (response) {
            utils.writeJson(res, response);
          });
      }
      else{
        utils.writeJson(res, {
          responseCode: 401,
          responseMessage: "Unauthorize"
        });
      }
      break;
  }
};
module.exports.deletePriority = async function deletePriority(req, res, next) {
  var signature = req.swagger.params["signature"].value;
  var version = req.swagger.params["v"].value;
  var data = req.swagger.params["body"].value;
  var token = req.swagger.params["token"].value;
  isValid = new validator(signature, token);
  if (!data._id) {
      utils.writeJson(res, {
          responseCode: process.env.WRONGINPUT_RESPONSE,
          responseMessage: "_id is required",
      });
      return;
  }

  data = await isValid.decryptObjectData(data);
  if (!data) {
    return utils.writeJson(res, {
      responseCode: 406,
      responseMessage: "Unable to read data"
    })
  }

  switch (version) {
    case 2:
      break;
    default:
      if (await isValid.checkSignature() && await isValid.checkToken()) {
        apiService
          .deletePriority(data)
          .then(function (response) {
            utils.writeJson(res, response);
          })
          .catch(function (response) {
            utils.writeJson(res, response);
          });
      }
      else{
        utils.writeJson(res, {
          responseCode: 401,
          responseMessage: "Unauthorize"
        });
      }
      break;
  }
};
module.exports.getPriority = async function getPriority(req, res, next) {
  var signature = req.swagger.params["signature"].value;
  var clientKey = req.swagger.params["clientKey"].value;
  var token = req.swagger.params["token"].value;
  var param = {}
  isValid = new validator(signature);
  var version = 1;
  switch (version) {
    case 2:
      break;
    default:
      if (await isValid.checkSignature()) {
        console.log('getPriority isValid checkSignature')
        apiService
          .getPriority(param)
          .then(async function (response) {
            // if (response.data) {
            //   response.data = await asym.encryptArrayObjectRsa(response.data, clientKey);
            // }
            utils.writeJson(res, response);
          })
          .catch(function (response) {
            console.log('catch checkSignature response=>',response)
            utils.writeJson(res, response);
          });
      }
      else{
        //cek with secretkey
        console.log('getPriority checking checkSecretKey')
        let cs = await checking.checkSecretKey(signature);
        if (cs.responseCode == process.env.SUCCESS_RESPONSE) {
          apiService
          .getPriority(param)
          .then(async function (response) {
            utils.writeJson(res, response);
          })
          .catch(function (response) {
            console.log('catch checkSecretKey response=>',response)
            utils.writeJson(res, response);
          });
        }else{
          utils.writeJson(res, {
            responseCode: 401,
            responseMessage: "Unauthorize"
          });
        }
      }
      break;
  }
};