'use strict';
var mongoose = require('mongoose').set('debug', true);
var mongoConf = require('../config/mongo');
var FormData = require('form-data');
var fs = require('fs');
const log = require('../config/log');

const moment = require('moment');
const request = require('request');
const asym = require('../config/asymmetric');

/**
 * Delete purchase order by ID
 * For valid response try integer IDs with positive integer value.         Negative or non-integer values will generate API errors
 *
 * orderId Long ID of the order that needs to be deleted
 * no response value expected for this operation
 **/

exports.accountPost = function () {
  return new Promise(async function (resolve, reject) {
    resolve("Hello from service");
  });
};

exports.getOrder = function (data) {
  console.log('getOrder data =>', data)
  return new Promise(async function (resolve, reject) {
    let res = {};
    try {
      if (data != "all") {
        let pId = {},
          pMN = {},
          pMP = {},
          pRN = {},
          pRP = {},
          pSV = {},
          pOC = {},
          pOR = {},
          pAN = {},
          pStatus = {},
          pDate = {};
        if (data._id) {
          pId = {
            '_id': data._id
          }
        }
        if (data.serviceName) {
          if (data.serviceName != 'all') {
            pSV = {
              'serviceName': data.serviceName
            }
          }
        }
        if (data.merchantName) {
          pMN = {
            'merchantName': data.merchantName
          }
        }
        if (data.merchantPhone) {
          pMP = {
            'merchantPhone': data.merchantPhone
          }
        }
        if (data.receiverName) {
          pRN = {
            'receiverName': data.receiverName
          }
        }
        if (data.receiverPhone) {
          pRP = {
            'receiverPhone': data.receiverPhone
          }
        }
        if (data.assignName) {
          pAN = {
            'assignName': data.assignName
          }
        }

        if (data.orderCode) {
          pOC = {
            'orderCode': data.orderCode
          }
        }
        if (data.orderReff) {
          pOR = {
            'orderReff': data.orderReff
          }
        }
        if (data.status) {
          if(data.status=='Pending'){data.status='pending'}
          pStatus = {
            'status': data.status
          }
        }

        if (data.transactionEndDate) {
          if (!data.transactionStartDate) {
            response = {
              responseCode: process.env.WRONGINPUT_RESPONSE,
              responseMessage: "Please insert the start date"
            }
            resolve(message);
          } else {
            var tom = new Date(data.transactionEndDate);
            console.log('tomtomtom=>', tom)
            var tom = '';
            tom = data.transactionEndDate;
            // pDate = {
            //   "createdDate": {
            //     "$gte": new Date(data.transactionStartDate),
            //     "$lte": new Date(tom)
            //   }
            // };
            pDate = {
              "pickupDate": {
                "$gte": data.transactionStartDate,
                "$lte": data.transactionEndDate,
              }
            };            
          }
        }
        var param = extend({}, pId, pMN, pMP, pRN, pRP, pSV, pOC, pOR, pAN, pStatus, pDate);
      } else {
        param = {}
      }
      await mongoose.connect(mongoConf.mongoDb.url, {
        useNewUrlParser: true
      });
      let query = await orderSchema.find(param).populate('assignId');
      // console.log("query =>", query[0]);
      await mongoose.connection.close();
      if (query.length > 0) {
        if (data.export) { //export
          //get email admin link
          var adminLink = 'phawiro@gmail.com';
          if(data.profile.email) {
            var adminLink = data.profile.email;
          }
          console.log('adminLink =>',adminLink)
          var dt = [];
          var i = 0;
          query.forEach(r => {
            i++;
            dt.push({
              'no': i.toString(),
              'orderCode': checkIfNull(r.orderCode, ''), 
              'merchantId': checkIfNull(r.merchantId, ''),
              'pickupDate': checkIfNull(r.pickupDate, ''),
              'pickupTime': checkIfNull(r.pickupTime, ''),
              'merchantName': checkIfNull(r.merchantName, ''),
              'merchantPhone': checkIfNull(r.merchantPhone, ''),
              'merchantAddress': checkIfNull(r.merchantAddress, ''),
              'merchantDistrict': checkIfNull(r.merchantDistrict, ''),
              'receivertName': checkIfNull(r.receiverName, ''),
              'receiverPhone': checkIfNull(r.receiverPhone, ''),
              'receiverAddress': checkIfNull(r.receiverAddress, ''),
              'receiverDistrict': checkIfNull(r.receiverDistrict, ''),
              'packageType': checkIfNull(r.packageType, ''),
              'serviceName': checkIfNull(r.serviceName, ''),
              'total': checkIfNull(r.total, ''),
              'paymentBy': checkIfNull(r.paymentBy, ''),
              'paymentMethod': checkIfNull(r.paymentMethod, ''),
              'note': checkIfNull(r.note, '')
            })
          });
          var headingColumnNames = ["No", "Order Id", "Id User", "Tanggal Pengambilan", "Jam Pengambilan", "Nama Pengirim", "Telp Pengirim", "Alamat Pengirim", "Kec. Pengirim","Nama Penerima", "Telp Penerima", "Alamat Penerima", "Kec. Penerima", "Jenis Barang", "Jenis Pengiriman", "Total", "Pembayaran Oleh", "Metode Pembayaran", "Keterangan"];
          var ds = {
            fullname: "admin",
            category: 'exportOrder',
            email: adminLink,
            regard_name: "admin",
            headingColumnNames: headingColumnNames,
            record: JSON.stringify(dt)
          }
          var se = await sendEmail(ds);console.log('sendEmail =>', se)
          res.responseCode = se.responseCode;
          res.responseMessage = se.responseMessage;
          // var dSend = {
          //   record: dt,
          //   headingColumnNames: headingColumnNames
          //   }
          // var ce = await createExcel(dSend);   
          // console.log('createExcel =>',ce)      
          // res.responseCode = process.env.SUCCESS_RESPONSE;
          // res.responseMessage = "Success";

        } else {
          res.responseCode = process.env.SUCCESS_RESPONSE;
          res.responseMessage = "Success";
          res.data = query;
        }
      } else {
        res.responseCode = process.env.NOTFOUND_RESPONSE;
        res.responseMessage = "Data not found";
      }
      resolve(res)
    } catch (err) {
      console.log('Error for get order ==> ', err)
      res = {
        'responseCode': process.env.ERRORINTERNAL_RESPONSE,
        'responseMessage': 'Internal server error, please try again!'
      }
      resolve(res);

    }
    // resolve();
  });
}

exports.postDriver = function (data) {
  // console.log('postDriver =>',data)
  return new Promise(async function (resolve, reject) {
    let res = {};
    try {
      var cd = await checkDriver({
        "driverId": data.driverId
      });
      if (cd.length > 0) {
        res.responseCode = process.env.FAILED_RESPONSE;
        res.responseMessage = "Failed driver created";
      } else {
        await mongoose.connect(mongoConf.mongoDb.url, {
          useNewUrlParser: true
        });
        let newApi = new driverSchema({
          driverId: data.driverId,
          driverName: data.driverName,
          driverPhone: data.driverPhone,
          driverAddress: data.driverAddress,
          driverEmail: data.driverEmail,
          driverVehicleInfo: data.driverVehicleInfo,
          driverStatus: 'off',
        });
        let na = await newApi.save();
        let filter = {
          driverId: data.driverId
        }
        let update = {};
        if (data.driverImage) {
          update = {
            driverImage: data.driverImage
          }
          mongoose.set('debug', false);
          await driverSchema.findOneAndUpdate(filter, update);
          mongoose.set('debug', true);
        }
        if (data.cardImage) {
          update = {
            cardImage: data.cardImage
          }
          mongoose.set('debug', false);
          await driverSchema.findOneAndUpdate(filter, update);
          mongoose.set('debug', true);
        }
        await mongoose.connection.close();
        if (na) {
          res.responseCode = process.env.SUCCESS_RESPONSE;
          res.responseMessage = "New driver created";
        } else {
          res.responseCode = process.env.FAILED_RESPONSE;
          res.responseMessage = "Failed driver order";
        }
      }
      resolve(res);

    } catch (err) {
      console.log('Error for create order ==> ', err)
      res = {
        'responseCode': process.env.ERRORINTERNAL_RESPONSE,
        'responseMessage': 'Internal server error, please try again!'
      }
      resolve(res);
    }
  });
}

exports.putDriver = function (data) {
  console.log('postDriver =>', data)
  return new Promise(async function (resolve, reject) {
    let res = {};
    try {
      if (data._id) {
        var cd = await checkDriver({
          "_id": data._id
        });
      } else {
        var cd = await checkDriver({
          "driverEmail": data.driverEmail,
          "driverPhone": data.driverPhone
        });
      }
      if (cd.length > 0) {
        await mongoose.connect(mongoConf.mongoDb.url, {
          useNewUrlParser: true
        });

        let vName = {},
          vPhone = {},
          vAddress = {},
          vEmail = {},
          vVehicleInfo = {},
          vStatus = {},
          vExtId = {};
        if (data.driverName) {
          vName = {
            'driverName': data.driverName
          }
        }
        if (data.driverPhone) {
          vPhone = {
            'driverPhone': data.driverPhone
          }
        }
        if (data.driverAddress) {
          vAddress = {
            'driverAddress': data.driverAddress
          }
        }
        if (data.driverEmail) {
          vEmail = {
            'driverEmail': data.driverEmail
          }
        }
        if (data.driverVehicleInfo) {
          vVehicleInfo = {
            'driverVehicleInfo': data.driverVehicleInfo
          }
        }
        if (data.driverStatus) {
          vStatus = {
            'driverStatus': data.driverStatus
          }
        }
        if (data.extId) {
          vExtId = {
            'extId': data.extId
          }
        }

        var value = extend({}, vName, vPhone, vAddress, vVehicleInfo, vEmail, vStatus, vExtId);
        let na = await driverSchema.findOneAndUpdate({
          "_id": cd[0]._id
        }, {
          $set: value
        }, {
          useFindAndModify: false
        });
        await mongoose.connection.close();
        if (na) {
          res.responseCode = process.env.SUCCESS_RESPONSE;
          res.responseMessage = "Driver updated";
        } else {
          res.responseCode = process.env.FAILED_RESPONSE;
          res.responseMessage = "Failed driver update";
        }
      } else {
        res.responseCode = process.env.FAILED_RESPONSE;
        res.responseMessage = "Failed driver update";
      }
      resolve(res);

    } catch (err) {
      console.log('Error for create order ==> ', err)
      res = {
        'responseCode': process.env.ERRORINTERNAL_RESPONSE,
        'responseMessage': 'Internal server error, please try again!'
      }
      resolve(res);
    }
  });
}

exports.getDriver = function (data) {
  console.log('getDriver =>', data)
  return new Promise(async function (resolve, reject) {
    let res = {};
    try {
      await mongoose.connect(mongoConf.mongoDb.url, {
        useNewUrlParser: true
      });
      let query = await driverSchema.find(data);
      await mongoose.connection.close();

      if (query.length > 0) {
        res.responseCode = process.env.SUCCESS_RESPONSE;
        res.responseMessage = "Success";
        res.data = query;
      } else {
        res.responseCode = process.env.NOTFOUND_RESPONSE;
        res.responseMessage = "Data not found";
      }
      resolve(res)
    } catch (err) {
      console.log('Error for get driver ==> ', err)
      res = {
        'responseCode': process.env.ERRORINTERNAL_RESPONSE,
        'responseMessage': 'Internal server error, please try again!'
      }
      resolve(res);

    }
    // resolve();
  });
}
exports.postAccount = function (data) {
  console.log('postAccount data =>',data)
  return new Promise(async function (resolve, reject) {
    let res = {};
    try {
      var cd = [];
      if(data.employe_id){
        var cd = await checkAccount({
          "employee_id": data.employee_id
        });
      }else if(data.employe_email){
        var cd = await checkAccount({
          "employee_id": data.employee_id
        });
      }
      console.log('cd.length =>',cd.length)
      if (cd.length > 0) {
        res.responseCode = process.env.FAILED_RESPONSE;
        res.responseMessage = "Failed account created";
      } else {
        await mongoose.connect(mongoConf.mongoDb.url, {
          useNewUrlParser: true
        });
        let newApi = new accountSchema({
          company_id: data.company_id,
          company_name: data.company_name,
          employee_id: data.employee_id,
          employee_name: data.employee_name,
          auth_id: data.auth_id,
          division_id: data.division_id,
          division_name: data.division_name,
          employee_phone: data.employee_phone,
          employee_email: data.employee_email,
        });
        let na = await newApi.save();        
        await mongoose.connection.close();
        if (na) {
          res.responseCode = process.env.SUCCESS_RESPONSE;
          res.responseMessage = "New account created";
        } else {
          res.responseCode = process.env.FAILED_RESPONSE;
          res.responseMessage = "Failed account order";
        }
      }
      resolve(res);

    } catch (err) {
      console.log('Error for create order ==> ', err)
      res = {
        'responseCode': process.env.ERRORINTERNAL_RESPONSE,
        'responseMessage': 'Internal server error, please try again!'
      }
      resolve(res);
    }
  });
}
exports.putAccount = function (data) {
  console.log('putAccount =>', data)
  return new Promise(async function (resolve, reject) {
    let res = {};
    try {
      if (data._id) {
        var cd = await checkAccount({
          "_id": data._id
        });
      } else {
        var cd = await checkAccount({
          "employee_email": data.employee_email
        });
      }
      if (cd.length > 0) {
        await mongoose.connect(mongoConf.mongoDb.url, {
          useNewUrlParser: true
        });

        let vCompId = {}, vCompName = {}, vEmployeeId = {}, vEmpName = {}, vDivId = {}, vEmpPhone = {}, vEmpEmail = {};
        if (data.driverName) {
          vCompId = {
            'company_id': data.company_id
          }
        }
        if (data.driverPhone) {
          vCompName = {
            'company_name': data.company_name
          }
        }
        if (data.driverAddress) {
          vEmpId = {
            'employee_id': data.employee_id
          }
        }
        if (data.driverEmail) {
          vEmpName = {
            'employee_name': data.employee_name
          }
        }
        if (data.driverVehicleInfo) {
          vDivId = {
            'division_id': data.division_id
          }
        }
        if (data.driverStatus) {
          vEmpPhone = {
            'employee_phone': data.employee_phone
          }
        }
        if (data.extId) {
          vEmpEmail = {
            'employee_email': data.employee_email
          }
        }

        var value = extend({}, vCompId, vCompName, vEmpId, vDivId, vEmpName, vEmpPhone, vEmpEmail);
        let na = await driverSchema.findOneAndUpdate({
          "_id": cd[0]._id
        }, {
          $set: value
        }, {
          useFindAndModify: false
        });
        await mongoose.connection.close();
        if (na) {
          res.responseCode = process.env.SUCCESS_RESPONSE;
          res.responseMessage = "Account updated";
        } else {
          res.responseCode = process.env.FAILED_RESPONSE;
          res.responseMessage = "Failed account update";
        }
      } else {
        res.responseCode = process.env.FAILED_RESPONSE;
        res.responseMessage = "Failed account update";
      }
      resolve(res);

    } catch (err) {
      console.log('Error for update account ==> ', err)
      res = {
        'responseCode': process.env.ERRORINTERNAL_RESPONSE,
        'responseMessage': 'Internal server error, please try again!'
      }
      resolve(res);
    }
  });
}
exports.getDriverOld = function (data) {
  return new Promise(async function (resolve, reject) {
    let res = {};
    try {
      let res = await getEmployee(data);
      if (res.responseCode == process.env.SUCCESS_RESPONSE) {
        // res.responseCode = ge.responseCode;
        // res.responseMessage = ge.responseMessage;
        // res.data = ge.data;
      } else {
        res.responseCode = process.env.NOTFOUND_RESPONSE;
        res.responseMessage = "Data not found";
      }
      console.log('getEmployee =>', res.data)

      // if (query.length > 0) {
      //     res.responseCode = process.env.SUCCESS_RESPONSE;
      //     res.responseMessage = "Success";
      //     res.data = query;
      // } else {
      //     res.responseCode = process.env.NOTFOUND_RESPONSE;
      //     res.responseMessage = "Data not found";
      // }
      resolve(res)
    } catch (err) {
      console.log('Error for get driver ==> ', err)
      res = {
        'responseCode': process.env.ERRORINTERNAL_RESPONSE,
        'responseMessage': 'Internal server error, please try again!'
      }
      resolve(res);

    }
    // resolve();
  });
}
exports.postOrder = function (data) {
  console.log('postOrder data =>',data )
  return new Promise(async function (resolve, reject) {
    var dt = {
      "accessor": data.profile.username,
      "accessorId": data.profile.phoneCode + '' + data.profile.phone + '_' + data.profile.deviceId,
      "accessorAddress": data.profile.accAddress,
      "accessorCategory": 'merchant',
      'link': data.profile.link,
      'method': data.profile.method,
      'moduleName': 'Create order request'
    };
    let res = {};
    try {
      //getCity
      var merchantDistrict='',receiverDistrict='';
      if(data.merchantLat){
        if(data.merchantLong){
          var latlng = data.merchantLat+', '+data.merchantLong;
          var gc = await getCity({latlng: latlng})
          if(gc.responseCode=process.env.SUCCESS_RESPONSE){
            merchantDistrict=gc.data;
          }
        }
      }
      if(data.receiverLat){
        if(data.receiverLong){
          var latlng = data.receiverLat+', '+data.receiverLong;
          var gc = await getCity({latlng: latlng})
          console.log('receiverLong =>',gc)
          if(gc.responseCode=process.env.SUCCESS_RESPONSE){
            receiverDistrict=gc.data;
          }
        }
      }

      var orderReff = await getOrderReff();
      console.log('orderReff =>', orderReff)
      await mongoose.connect(mongoConf.mongoDb.url, {
        useNewUrlParser: true
      });
      let newApi = new orderSchema({
        serviceName: data.serviceName,
        pickupTime: data.pickupTime,
        pickupDate: data.pickupDate,
        orderCode: data.orderCode,
        orderReff: orderReff,
        merchantId: data.merchantId,
        merchantName: data.merchantName,
        merchantAddress: data.merchantAddress,
        merchantPhone: data.merchantPhone,
        merchantLat: data.merchantLat,
        merchantLong: data.merchantLong,
        merchantDistrict: merchantDistrict,
        receiverName: data.receiverName,
        receiverAddress: data.receiverAddress,
        receiverPhone: data.receiverPhone,
        receiverLat: data.receiverLat,
        receiverLong: data.receiverLong,
        receiverDistrict:receiverDistrict,
        pickupTime: data.pickupTime,
        status: data.status,
        secretKey: data.secretKey,
        orderItem: data.orderItem,
        packageType: data.packageType,
        paymentBy: 'Ultimeal',
        note: data.note,
        paymentMethod: data.paymentMethod,
        total: data.total,
        userCreated: data.userCreated,
      });
      let na = await newApi.save();
      // let na = {};
      await mongoose.connection.close();
      if (na) {
        res.responseCode = process.env.SUCCESS_RESPONSE;
        res.responseMessage = "New order created";
        var employee_id=0;
        if(data.profile.employee_id){employee_id=data.profile.employee_id}
        var activities = {
          category: "Ultisend",
          module: "Create Order",
          description: "Create Order, data : (id) "+na._id + ", (receiverName) "+na.receiverName,
          user_id: employee_id,
          user_name: data.profile.email,
          crud_id: 0
        }
        console.log('activities =>',activities)
        dt.activities = activities;
        log.addLog(dt);
      } else {
        res.responseCode = process.env.FAILED_RESPONSE;
        res.responseMessage = "Failed create order";
      }
      resolve(res);

    } catch (err) {
      console.log('Error for create order ==> ', err)
      res = {
        'responseCode': process.env.ERRORINTERNAL_RESPONSE,
        'responseMessage': 'Internal server error, please try again!'
      }
      resolve(res);
    }
  });
}
exports.putOrder = function (data) {
  console.log('putOrder data =>', data)
  return new Promise(async function (resolve, reject) {
    var dt = {
      "accessor": data.profile.username,
      "accessorId": data.profile.phoneCode + '' + data.profile.phone + '_' + data.profile.deviceId,
      "accessorAddress": data.profile.accAddress,
      "accessorCategory": 'merchant',
      'link': data.profile.link,
      'method': data.profile.method,
      'moduleName': 'Update order request'
    };
    let res = {};
    try {
      await mongoose.connect(mongoConf.mongoDb.url, {
        useNewUrlParser: true
      });

      let query = await orderSchema.find({
        "orderCode": data.orderCode
      });
      console.log('query =>', query)
      if (query) {
        // console.log('query =>',query)
        // let na = {};
        let na = await orderSchema.findOneAndUpdate({
          "_id": query[0]._id
        }, {
          $set: {
            status: data.status
          }
        }, {
          useFindAndModify: false
        });
        await mongoose.connection.close();
        let messageNotif = "Pesanan " + query[0].orderCode + ", atas nama " + query[0].receiverName + " sudah siap di ambil";
        // send notif 
        var ds = {};
        ds.messageNotif = messageNotif;
        ds.orderCode = query[0].orderCode;
        ds.merchantName = query[0].merchantName;
        ds.merchantAddress = query[0].merchantAddress;
        ds.receiverName = query[0].receiverName;
        ds.receiverAddress = query[0].receiverAddress;
        ds.receiverPhone = query[0].receiverPhone;

        await mongoose.connect(mongoConf.mongoDb.url, {
          useNewUrlParser: true
        });
        var ols = await orderLogSchema.find({
          "orderId": query[0]._id
        }).populate('driverId');
        await mongoose.connection.close();
        if (ols.length > 0) {
          ds.extId = ols[0].driverId.extId;
          if (ds.extId) {
            await sendNotif(ds);
          }
        }

        console.log('messageNotif =>', messageNotif)
        if (na) {
          res.responseCode = process.env.SUCCESS_RESPONSE;
          res.responseMessage = "Order updated";
          var activities = {
            category: "Ultisend",
            module: "Update Order",
            description: "Update Order, data : (id) "+na._id + ", (status) "+data.status,
            user_id: 0,
            user_name: data.profile.email,
            crud_id: 0
          }
          console.log('activities =>',activities)
          dt.activities = activities;
          log.addLog(dt);
  
        } else {
          res.responseCode = process.env.FAILED_RESPONSE;
          res.responseMessage = "Failed updat order";
        }
      } else {
        res.responseCode = process.env.FAILED_RESPONSE;
        res.responseMessage = "Failed updat order";
      }
      resolve(res);

    } catch (err) {
      console.log('Error for create order ==> ', err)
      res = {
        'responseCode': process.env.ERRORINTERNAL_RESPONSE,
        'responseMessage': 'Internal server error, please try again!'
      }
      resolve(res);
    }
  });
}
exports.deleteOrder = function (orderId) {
  return new Promise(function (resolve, reject) {
    resolve();
  });
}

exports.assignOrderUpdate = function (data) {
  console.log('assignOrderUpdate data =>',data)
  return new Promise(async function (resolve, reject) {
    var dt = {
      "accessor": data.profile.username,
      "accessorId": data.profile.phoneCode + '' + data.profile.phone + '_' + data.profile.deviceId,
      "accessorAddress": data.profile.accAddress,
      "accessorCategory": 'merchant',
      'link': data.profile.link,
      'method': data.profile.method,
      'moduleName': 'Update assign order request'
    };

    let res = {};
    var assignImage = '';
    // var bodyParser = require('body-parser');
    // var app = require("restana")();
    // app.use(bodyParser());

    try {
      console.log('assignOrderUpdate data y =>', data)
      // let sl = await checkLog(data)
      let sl = [];
      if (sl.length > 0) {
        res.responseCode = process.env.FAILED_RESPONSE;
        res.responseMessage = "Failed update assign order";
      } else {
        await mongoose.connect(mongoConf.mongoDb.url, {
          useNewUrlParser: true
        });
        let na = await orderSchema.find({
          "_id": data.orderId
        });
        await mongoose.connection.close();
        if (na.length > 0) {
          console.log('orderSchema find length =>', na.length)
          await mongoose.connect(mongoConf.mongoDb.url, {
            useNewUrlParser: true
          });
          let query = await driverSchema.find({
            "driverId": data.driverId
          });
          await mongoose.connection.close();
          console.log('driverSchema 1 =>', query)
          console.log('driverSchema lenght =>', query.length)
          if (query.length > 0) {
            var ds = {};
            var tmp = query[0];
            ds.courierPhoto = query[0].driverImage;
            ds.courierName = query[0].driverName;
            ds.courierPhoneNumber = query[0].driverPhone;
            ds.courierVehicleInfo = query[0].driverVehicleInfo;
            ds.status = data.status;
            ds.orderCode = na[0].orderCode;
            ds.secretKey = na[0].secretKey;
            var uu = await updateUltisend(ds)
            if (uu.responseCode == process.env.SUCCESS_RESPONSE) {
              console.log('updateUltisend ress =>', uu.responseCode)
              //update order 
              await mongoose.connect(mongoConf.mongoDb.url, {
                useNewUrlParser: true
              });
              let uos = await orderSchema.findOneAndUpdate({
                "_id": data.orderId
              }, {
                $set: {
                  status: data.status
                }
              }, {
                useFindAndModify: false
              });
              await mongoose.connection.close();
              console.log('update orderSchema =>', uos)
              if (data.status == 'delivered') {
                // update driver status
                await mongoose.connect(mongoConf.mongoDb.url, {
                  useNewUrlParser: true
                });
                await driverSchema.findOneAndUpdate({
                  "driverId": data.driverId
                }, {
                  $set: {
                    driverStatus: 'off'
                  }
                }, {
                  useFindAndModify: false
                });
                await mongoose.connection.close();
              }

              // insert log
              let newApi = new orderLogSchema({
                orderId: data.orderId,
                driverId: tmp._id,
                responseNotes: data.responseNotes,
                status: data.status,
                userCreated: data.userCreated,
              });
              await mongoose.connect(mongoConf.mongoDb.url, {
                useNewUrlParser: true
              });
              await newApi.save();
              await mongoose.connection.close();

              res.responseCode = process.env.SUCCESS_RESPONSE;
              res.responseMessage = "Success, update assign order"

              var activities = {
                category: "Ultisend",
                module: "Update Assign Order",
                description: "Update Assign Order, data : (id) "+data.orderId + ", (status) "+data.status,
                user_id: data.profile.id,
                user_name: data.profile.email,
                crud_id: 0
              }
              console.log('activities =>',activities)
              dt.activities = activities;
              log.addLog(dt);    
            } else {
              res.responseCode = process.env.FAILED_RESPONSE;
              res.responseMessage = "Failed update assign order";
            }
          } else {
            console.log('driver not found')
            res.responseCode = process.env.FAILED_RESPONSE;
            res.responseMessage = "Failed update assign order, driver not found";

          }
        } else {
          res.responseCode = process.env.FAILED_RESPONSE;
          res.responseMessage = "Failed, update assign order";
        }
        // await mongoose.connect(mongoConf.mongoDb.url, {useNewUrlParser: true});
        // // update order status
        // let na = await orderSchema.findOneAndUpdate({"_id": data.orderId}, {
        //   $set: {
        //     status: data.status
        //   }
        // }, {
        //   useFindAndModify: false
        // });
        // await mongoose.connection.close();
        // console.log('nanananananana=>',na)
        // if(data.status == 'delivered'){
        //   // update driver status
        //   await mongoose.connect(mongoConf.mongoDb.url, {useNewUrlParser: true});
        //   await driverSchema.findOneAndUpdate({"driverId": data.driverId}, {
        //     $set: {
        //       driverStatus: 'off'
        //     }
        //   }, {
        //     useFindAndModify: false
        //   });
        //   await mongoose.connection.close();
        // }

        // if (na) {
        //   await mongoose.connect(mongoConf.mongoDb.url, {useNewUrlParser: true});
        //   let query = await driverSchema.find({"driverId": data.driverId});
        //   await mongoose.connection.close();
        //   console.log('driverSchema 1 =>',query)
        //   console.log('driverSchema lenght =>',query.length)
        //   if(query.length >0){
        //     var ds = {};
        //     var tmp = query[0];
        //     ds.courierPhoto = query[0].driverImage;
        //     ds.courierName = query[0].driverName;
        //     ds.courierPhoneNumber = query[0].driverPhone;
        //     ds.courierVehicleInfo = query[0].driverVehicleInfo;
        //     ds.status = data.status;
        //     ds.orderCode = na.orderCode;
        //     ds.secretKey=na.secretKey;
        //     var uu = await updateUltisend(ds)
        //     console.log('updateUltisend =>',uu)  

        //     // insert log
        //     let newApi = new orderLogSchema({
        //       orderId: data.orderId,
        //       // driverId: data.driverId, // error, change objId
        //       // driverId: query[0]._id,
        //       driverId: tmp._id,
        //       responseNotes: data.responseNotes,
        //       status: data.status,
        //       userCreated: data.userCreated,
        //     });
        //     await mongoose.connect(mongoConf.mongoDb.url, {useNewUrlParser: true});
        //     await newApi.save();
        //     await mongoose.connection.close();
        //   }else{
        //     console.log('driver not found')
        //   }

        //   res.responseCode = process.env.SUCCESS_RESPONSE;
        //   res.responseMessage = "Success,update assign order"
        // } else {
        //   res.responseCode = process.env.FAILED_RESPONSE;
        //   res.responseMessage = "Failed assign order";
        // }
        // await mongoose.connection.close();

      }
      console.log("res::", res);
      resolve(res);
    } catch (err) {
      console.log('Error for assignOrderUpdate ==> ', err)
      res = {
        'responseCode': process.env.ERRORINTERNAL_RESPONSE,
        'responseMessage': 'Internal server error, please try again!'
      }
      resolve(res);
    }
  });
}

exports.assignOrderPost = function (data) {
  console.log('assignOrderPost =>', data)
  return new Promise(async function (resolve, reject) {
    var dt = {
      "accessor": data.profile.username,
      "accessorId": data.profile.phoneCode + '' + data.profile.phone + '_' + data.profile.deviceId,
      "accessorAddress": data.profile.accAddress,
      "accessorCategory": 'merchant',
      'link': data.profile.link,
      'method': data.profile.method,
      'moduleName': 'Assign order request'
    };

    let res = {};
    var assignImage = '';
    try {
      // let sl = await checkLog(data)
      // console.log('checkLog =>',sl)
      let sl = []; //sementara ga pakai pengecekean 
      if (sl.length > 0) {
        res.responseCode = process.env.FAILED_RESPONSE;
        res.responseMessage = "Failed assign order";
      } else {
        // //get image url // no postgree connection
        // let gp = await pgCon.query("select f.path  from employee e join personal_profile pf on e.personal_profile_id=pf.id left join file f on pf.profile_img=f.id where e.id="+data.driverId);
        // if(gp.rows.length>0){
        //   var assignImage = gp.rows[0].path;
        // }

        await mongoose.connect(mongoConf.mongoDb.url, {
          useNewUrlParser: true
        });
        // insert log
        let newApi = new orderLogSchema({
          orderId: data.orderId,
          driverId: data.driverId,
          responseNotes: data.responseNotes,
          status: data.status,
          userCreated: data.userCreated,
        });
        await newApi.save();
        // update first driver status (if first driver can't complete the mission )
        if (data.firstDriverId) {
          await driverSchema.findOneAndUpdate({
            "driverId": data.firstDriverId
          }, {
            $set: {
              driverStatus: 'off'
            }
          }, {
            useFindAndModify: false
          });
        }

        // update driver status
        await driverSchema.findOneAndUpdate({
          "driverId": data.driverId
        }, {
          $set: {
            driverStatus: 'on'
          }
        }, {
          useFindAndModify: false
        });

        // update order status
        let na = await orderSchema.findOneAndUpdate({
          "_id": data.orderId
        }, {
          $set: {
            assignId: data.driverId,
            assignName: data.driverName,
            assignImage: assignImage,
            status: data.status
          }
        }, {
          useFindAndModify: false
        });
        console.log('na 1 =>', na)
        var gd = await driverSchema.find({
          "_id": data.driverId
        });
        console.log('gd =>', gd)

        await mongoose.connection.close();
        console.log('driverSchema 1 =>', gd)
        console.log('driverSchema lenght =>', gd.length)
        if (gd.length > 0) {
          var ds = {};
          var tmp = gd[0];
          ds.courierPhoto = gd[0].driverImage;
          ds.courierName = gd[0].driverName;
          ds.courierPhoneNumber = gd[0].driverPhone;
          ds.courierVehicleInfo = gd[0].driverVehicleInfo;
          ds.status = data.status;
          ds.orderCode = na.orderCode;
          ds.secretKey = na.secretKey;
        }

        // await mongoose.connection.close();
        if (na) {
          console.log('na 2 =>', na)
          await mongoose.connect(mongoConf.mongoDb.url, {
            useNewUrlParser: true
          });
          var gd = await driverSchema.find({
            "_id": data.driverId
          });
          console.log('gd =>', gd)
          await mongoose.connection.close();
          console.log('driverSchema 1 =>', gd)
          console.log('driverSchema lenght =>', gd.length)
          if (gd.length > 0) {
            var ds = {};
            var tmp = gd[0];
            ds.courierPhoto = gd[0].driverImage;
            ds.courierName = gd[0].driverName;
            ds.courierPhoneNumber = gd[0].driverPhone;
            ds.courierVehicleInfo = gd[0].driverVehicleInfo;
            ds.status = data.status;
            ds.orderCode = na.orderCode;
            ds.secretKey = na.secretKey;
            var uu = await updateUltisend(ds)
            console.log('updateUltisend =>', uu)
          }
          res.responseCode = process.env.SUCCESS_RESPONSE;
          res.responseMessage = "Success, update assign order";
          var activities = {
            category: "Ultisend",
            module: "Assign Order",
            description: "Assign Order, data : (id) "+na._id + ", (status) "+data.status,
            user_id: data.profile.id,
            user_name: data.profile.email,
            crud_id: 0
          }
          dt.activities = activities;
          log.addLog(dt);
        } else {
          res.responseCode = process.env.FAILED_RESPONSE;
          res.responseMessage = "Failed update assign order";
        }
      }
      resolve(res);
    } catch (err) {
      console.log('Error for assignOrderPost ==> ', err)
      res = {
        'responseCode': process.env.ERRORINTERNAL_RESPONSE,
        'responseMessage': 'Internal server error, please try again!'
      }
      resolve(res);
    }
  });
}

/**
 * Returns pet inventories by status
 * Returns a map of status codes to quantities
 *
 * returns Map
 **/
exports.getInventory = function () {
  return new Promise(function (resolve, reject) {
    var examples = {};
    examples['application/json'] = {
      "key": 0
    };
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Find purchase order by ID
 * For valid response try integer IDs with value >= 1 and <= 10.         Other values will generated exceptions
 *
 * orderId Long ID of pet that needs to be fetched
 * returns Order
 **/
exports.getOrderById = function (orderId) {
  return new Promise(function (resolve, reject) {
    var examples = {};
    examples['application/json'] = {
      "petId": 6,
      "quantity": 1,
      "id": 0,
      "shipDate": "2000-01-23T04:56:07.000+00:00",
      "complete": false,
      "status": "placed"
    };
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Place an order for a pet
 * 
 *
 * body Order order placed for purchasing the pet
 * returns Order
 **/
exports.placeOrder = function (body) {
  return new Promise(function (resolve, reject) {
    var examples = {};
    examples['application/json'] = {
      "petId": 6,
      "quantity": 1,
      "id": 0,
      "shipDate": "2000-01-23T04:56:07.000+00:00",
      "complete": false,
      "status": "placed"
    };
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
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

async function getOrderReff() {
  var today = new Date();
  var day = today.getDate();
  today.setDate(today.getDate() - 1);
  var tomorow = new Date();
  tomorow.setDate(tomorow.getDate() + 1);
  await mongoose.connect(mongoConf.mongoDb.url, {
    useNewUrlParser: true
  });

  var head = 'REFF/' + moment().format('YYYYMMDD');
  var gte = moment().format('YYYY-MM-DD');
  var lte = moment().add(1, "days").format('YYYY-MM-DD');

  var query = await orderSchema.find({
    'createdDate': {
      '$gte': gte,
      '$lte': lte
    }
  }).sort({
    createdDate: -1
  });

  // let query = await orderSchema.aggregate([
  //   {$project: {day: {$dayOfMonth: '$createdDate'}, month: {$month: '$createdDate'}, year: {$year: '$createdDate'} }},
  //   {$match: {day: day, month: today.getMonth()+1, year: today.getFullYear()} },
  //   {$group: { _id: null, count: { $sum: 1 } }}
  // ]);

  if (query.length > 0) {
    var id = parseInt(query[0].orderReff.substr(14, 4)) + 1;
    var reff = head + '/' + String(id).padStart(4, '0');
  } else {
    var reff = head + '/0001';
  }
  await mongoose.connection.close();
  return reff;
}
async function checkLog(data) {
  await mongoose.connect(mongoConf.mongoDb.url, {
    useNewUrlParser: true
  });
  let query = await orderLogSchema.find({
    "orderId": data.orderId,
    "driverId": data.driverId,
    "status": data.status
  });

  await mongoose.connection.close();
  return query;
}
async function checkDriver(param) {
  await mongoose.connect(mongoConf.mongoDb.url, {
    useNewUrlParser: true
  });
  let query = await driverSchema.find(param);
  await mongoose.connection.close();
  return query;
}
async function checkAccount(param) {
  await mongoose.connect(mongoConf.mongoDb.url, {
    useNewUrlParser: true
  });
  let query = await accountSchema.find(param);
  await mongoose.connection.close();
  return query;
}
function getEmployee(data) {
  return new Promise(function (resolve, reject) {
    try {
      let a = {
        "companyProfileId": 146
      }
      let h = JSON.stringify(a);
      request.get({
        "headers": {
          "content-type": "application/json",
          "signature": data.signature,
          "token": data.token,
          "secretKey": data.secretKey,
          "param": asym.encryptAes(h),
          "clientKey": data.clientKey,
          "aes": data.aes
        },
        "url": "http://" + process.env.ACCOUNT_SERVICE_HOST + "/account/data/employee",
      }, async (error, response, body) => {
        // console.log("http://" + process.env.ACCOUNT_SERVICE_HOST + "/data/employee/" + h);
        console.log({
          "signature": data.signature, //masih hardcode
          "token": data.token,
          "secretKey": data.secretKey
        });
        if (error) {
          console.log('Error checking employee data => ', error)
          reject(process.env.ERRORINTERNAL_RESPONSE);
        } else {
          let result = JSON.parse(body);
          console.log('RESULT CHECK DATA EMPLOYEE => ', result);
          resolve(result);
        }
      })
    } catch (e) {
      console.log('Error checking employee data => ', e)
      reject(process.env.ERRORINTERNAL_RESPONSE);
    }
  })
}

async function updateUltisend(data) {
  return new Promise(async function (resolve, reject) {
    try {
      let buff = new Buffer(data.secretKey, 'base64');
      let text = buff.toString('ascii');
      var arr_text = text.split(":");
      var orderId = arr_text[0]

      var request = require('request');
      var options = {
        'method': 'PUT',
        'url': process.env.ULTIMEAL_HOST + '/api/v1/fo/brandOutlet/order/delivery/' + orderId,
        'headers': {
          'Authorization': data.secretKey
        },
        formData: {
          'courierPhoto': data.courierPhoto,
          'courierName': data.courierName,
          'courierPhoneNumber': data.courierPhoneNumber,
          'courierVehicleInfo': data.courierVehicleInfo,
          'status': data.status
        }
      };
      console.log('updateUltisend options =>', options)
      request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log('response.body =>', JSON.parse(response.body));
        resolve(JSON.parse(response.body));
      });
    } catch (e) {
      console.log('Error updateUltisend => ', e)
      reject(process.env.ERRORINTERNAL_RESPONSE);
    }
  })
}

async function sendNotif(data) {
  return new Promise(async function (resolve, reject) {
    try {
      let appID = process.env.NOTIF_APP_ID;
      let restKey = process.env.NOTIF_REST_KEY;
      let contentMessage = {
        'app_id': appID,
        'contents': {
          en: data.messageNotif
        },
        // 'included_segments': [
        //     'Subscribed Users'
        // ],
        'include_external_user_ids': [
          data.extId
        ],
        'data': {
          'orderCode': data.orderCode,
          'merchantName': data.merchantName,
          'merchantAddress': data.merchantAddress,
          'receiverName': data.receiverName,
          'receiverAddress': data.receiverAddress
        }

      };
      console.log('contentMessage =>', contentMessage);
      await request.post({
        "headers": {
          "authorization": "Basic " + restKey,
          "content-type": "application/json"
        },
        "url": "https://onesignal.com/api/v1/notifications",
        "body": JSON.stringify(contentMessage)
      }, (error, response, body) => {
        if (error) {
          console.log('error send notif', error)
          return error
        } else {
          console.log('send push notif', body);
          var result = JSON.parse(body);
          // let dataProfile = basket;
          var message = {
            "responseCode": process.env.SUCCESS_RESPONSE,
            "responseMessage": "Transaction Submitted",
            // "data": dataProfile
          };
          resolve(message);
        }
      });
    } catch (e) {
      console.log('Error updateUltisend => ', e)
      reject(process.env.ERRORINTERNAL_RESPONSE);
    }
  })
}

exports.createPriority = function (data) {
  return new Promise(async function (resolve, reject) {
    let res = {};
    try {
      await mongoose.connect(mongoConf.mongoDb.url, {
        useNewUrlParser: true
      });
      let newApi = new prioritySchema({
        name: data.name,
        time: data.time,
      });
      let na = await newApi.save();
      // let na = {};
      await mongoose.connection.close();
      if (na) {
        res.responseCode = process.env.SUCCESS_RESPONSE;
        res.responseMessage = "New priority time created";
      } else {
        res.responseCode = process.env.FAILED_RESPONSE;
        res.responseMessage = "Failed create priority time";
      }
      resolve(res);

    } catch (err) {
      console.log('Error for create priority time  ==> ', err)
      res = {
        'responseCode': process.env.ERRORINTERNAL_RESPONSE,
        'responseMessage': 'Internal server error, please try again!'
      }
      resolve(res);
    }
  });
}
exports.updatePriority = function (data) {
  return new Promise(async function (resolve, reject) {
    let res = {};
    try {
      await mongoose.connect(mongoConf.mongoDb.url, {
        useNewUrlParser: true
      });
      let na = await prioritySchema.findOneAndUpdate({
        "_id": data._id
      }, {
        $set: {
          name: data.name,
          time: data.time,
        }
      }, {
        useFindAndModify: false
      });

      await mongoose.connection.close();
      if (na) {
        res.responseCode = process.env.SUCCESS_RESPONSE;
        res.responseMessage = "Priority time updated";
      } else {
        res.responseCode = process.env.FAILED_RESPONSE;
        res.responseMessage = "Failed update priority time";
      }
      resolve(res);

    } catch (err) {
      console.log('Error for update priority time  ==> ', err)
      res = {
        'responseCode': process.env.ERRORINTERNAL_RESPONSE,
        'responseMessage': 'Internal server error, please try again!'
      }
      resolve(res);
    }
  });
}
exports.deletePriority = function (data) {
  return new Promise(async function (resolve, reject) {
    let res = {};
    try {
      await mongoose.connect(mongoConf.mongoDb.url, {
        useNewUrlParser: true
      });
      let na = await prioritySchema.deleteMany({
        "_id": data._id
      });

      await mongoose.connection.close();
      if (na) {
        res.responseCode = process.env.SUCCESS_RESPONSE;
        res.responseMessage = "Priority time deleted";
      } else {
        res.responseCode = process.env.FAILED_RESPONSE;
        res.responseMessage = "Failed delete priority time";
      }
      resolve(res);

    } catch (err) {
      console.log('Error for delete priority time  ==> ', err)
      res = {
        'responseCode': process.env.ERRORINTERNAL_RESPONSE,
        'responseMessage': 'Internal server error, please try again!'
      }
      resolve(res);
    }
  });
}
exports.getPriority = function (data) {
  return new Promise(async function (resolve, reject) {
    let res = {};
    try {
      await mongoose.connect(mongoConf.mongoDb.url, {
        useNewUrlParser: true
      });
      let query = await prioritySchema.find({});
      await mongoose.connection.close();

      if (query.length > 0) {
        res.responseCode = process.env.SUCCESS_RESPONSE;
        res.responseMessage = "Success";
        res.data = query;
      } else {
        res.responseCode = process.env.NOTFOUND_RESPONSE;
        res.responseMessage = "Data not found";
      }
      resolve(res)
    } catch (err) {
      console.log('Error for get priority ==> ', err)
      res = {
        'responseCode': process.env.ERRORINTERNAL_RESPONSE,
        'responseMessage': 'Internal server error, please try again!'
      }
      resolve(res);

    }
    // resolve();
  });
}

function sendEmail(data) {
  return new Promise(async function (resolve, reject) {
    let res = {};
    if (data.category != "rating_ticketing") {
      data = {
        "category": data.category,
        "fullname": data.fullname,
        "email": data.email,
        "link": data.link,
        "param": data.param,
        "headingColumnNames": data.headingColumnNames,
        "record": data.record
      }
    }
    try {
      request.post({
        "headers": {
          "content-type": "application/json",
          "signature": "xxx" //masih hardcode
        },
        "url": process.env.NOTIFICATION_HOST + "/sendNotif/email",
        "body": data,
        "json": true
      }, (error, response, body) => {
        console.log('SENDING NOTIF EMAIL => ', body)
        if (error) {
          console.log('error bridging sending link refund to email => ', error);
          resolve({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: 'Internal server error, please try again!'
          });
        } else {
          resolve(body);
        }
      })
    } catch (e) {
      console.log('Error when sending email => ', e);
      res.responseCode = process.env.ERRORINTERNAL_RESPONSE;
      res.responseMessage = "Internal server error, please try again!";
      resolve(res);
    }

  })
}

async function getAdminLink(data) {
  return new Promise(async function (resolve, reject) {
    try {
      request.get({
        "headers": {
          "content-type": "application/json",
          "param": JSON.stringify(data),
          "apiService": "eyJjb2RlIjoidWx0aXNlbmQifQ",
        },
        "url": process.env.ACCOUNT_SERVICE_HOST + "/data/employee",
      }, async (error, response, body) => {
        if (error) {
          console.log('Error checking employee data => ', error)
          reject(process.env.ERRORINTERNAL_RESPONSE);
        } else {
          let result = JSON.parse(body);
          // console.log('RESULT CHECK DATA EMPLOYEE => ', result);
          resolve(result);
        }
      })
    } catch (e) {
      console.log('Error checking employee data => ', e)
      reject(process.env.ERRORINTERNAL_RESPONSE);
    }
  })
}

function createExcel(data) {
  // console.log('createExcel =>',data)
  var headingColumnNames = data.headingColumnNames;
  var tmp = data.record;

  //generate excel with password
  var aCell = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U']
  const XlsxPopulate = require('xlsx-populate');
  XlsxPopulate.fromBlankAsync().then(wb => {
    var i = 0;
    headingColumnNames.forEach(heading => {
      var cell = aCell[i] + 1;
      wb.sheet("Sheet1").cell(cell).value(heading)
      i++;
    });
    let rowIndex = 2;
    tmp.forEach(record => {
      let columnIndex = 1;
      Object.keys(record).forEach(columnName => {
        wb.sheet("Sheet1").cell(rowIndex, columnIndex++).value(record[columnName])
      });
      rowIndex++;
    });

    return wb.toFileAsync("./orderPass.xlsx", {
      password: "123"
    });
  });

  return 200
}


function checkIfNull(text, changeTo = '') {
  if (text == 'null' || text == null) {
    return changeTo
  } else {
    return text
  }
}



function getCity(data) {
  return new Promise(async function (resolve, reject) {
    try {
      var kecamatan='';
      // var ggc = await geoCode({key: 'AIzaSyCh_hAuQqKYeTnotA4lDZ2cSwyASdoUQYI', latlng: '-7.310065, 112.734571'});
      var ggc = await geoCode({latlng: data.latlng});
      // console.log('geoCode =>',ggc)
      if(ggc.results.length>0) {
        //check if null
        var tmp = ggc.results[0].address_components;
        tmp.forEach(r=>{
          var o_name = r.long_name;
          var l_name = o_name.toLowerCase();
          var f_name = l_name.substring(0,9);
          if(f_name == 'kecamatan') {
            kecamatan=o_name.substring(10);
            // console.log('kecamatan =>',kecamatan);  
            // console.log('o_name =>',o_name);  
          }
        })
        if(kecamatan==''){//procces by types
          tmp.forEach(r=>{
            var o_name = r.long_name;
            if(r.types[0] == 'administrative_area_level_3') {
              kecamatan=o_name;
            }
          })
        }
        resolve({
          responseCode: process.env.SUCCESS_RESPONSE,
          data: kecamatan
        });
      }else{
        resolve({
          responseCode: process.env.NOTFOUND_RESPONSE,
          data: ''
        });

      }

    } catch (e) {
      console.log('Error when getKecamatan => ', e);
      resolve({
        responseCode: process.env.ERRORINTERNAL_RESPONSE,
        responseMessage: 'Internal server error, please try again!'
      });
    }
  })
}
function geoCode(data) {
  return new Promise(async function (resolve, reject) {
    try {
      data.key='AIzaSyCh_hAuQqKYeTnotA4lDZ2cSwyASdoUQYI';
      request.post({
        "headers": {},
        "url": "https://maps.googleapis.com/maps/api/geocode/json?key="+data.key+"&latlng="+data.latlng,
        "json": true
      }, (error, response, body) => {
        console.log('SENDING geoCode => ', body)
        if (error) {
          console.log('error bridging sending geoCode => ', error);
          resolve({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: 'Internal server error, please try again!'
          });
        } else {
          resolve(body);
        }
      })
    } catch (e) {
      console.log('Error when geoCode => ', e);
      resolve({
        responseCode: process.env.ERRORINTERNAL_RESPONSE,
        responseMessage: 'Internal server error, please try again!'
      });
    }
  })
}