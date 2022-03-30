"use strict";

var utils = require("../utils/writer.js");
var source = require("../service/sourceService");

module.exports.signinForm = function signinForm(req, res, next) {
  var cnt = req.swagger.params["continue"].value;
  var version = req.swagger.params["v"].value;
  switch (version) {
    case 2:
      break;
    default:
      source
        .signinForm_v1(cnt)
        .then(function (response) {
          utils.writeJson(res, response);
        })
        .catch(function (response) {
          utils.writeJson(res, response);
        });
      break;
  }
};

module.exports.landingSource = function landingSource(req, res, next) {
  var version = req.swagger.params["v"].value;
  switch (version) {
    case 2:
      break;
    default:
      source
        .landingSource_v1()
        .then(function (response) {
          utils.writeJson(res, response);
        })
        .catch(function (response) {
          utils.writeJson(res, response);
        });
      break;
  }
};

// module.exports.addPet = function addPet(req, res, next) {
//   var body = req.swagger.params["body"].value;
//   Pet.addPet(body)
//     .then(function (response) {
//       utils.writeJson(res, response);
//     })
//     .catch(function (response) {
//       utils.writeJson(res, response);
//     });
// };

// module.exports.deletePet = function deletePet(req, res, next) {
//   var petId = req.swagger.params["petId"].value;
//   var api_key = req.swagger.params["api_key"].value;
//   Pet.deletePet(petId, api_key)
//     .then(function (response) {
//       utils.writeJson(res, response);
//     })
//     .catch(function (response) {
//       utils.writeJson(res, response);
//     });
// };

// module.exports.findPetsByTags = function findPetsByTags(req, res, next) {
//   var tags = req.swagger.params["tags"].value;
//   Pet.findPetsByTags(tags)
//     .then(function (response) {
//       utils.writeJson(res, response);
//     })
//     .catch(function (response) {
//       utils.writeJson(res, response);
//     });
// };

// module.exports.getPetById = function getPetById(req, res, next) {
//   var petId = req.swagger.params["petId"].value;
//   Pet.getPetById(petId)
//     .then(function (response) {
//       utils.writeJson(res, response);
//     })
//     .catch(function (response) {
//       utils.writeJson(res, response);
//     });
// };

// module.exports.updatePet = function updatePet(req, res, next) {
//   var body = req.swagger.params["body"].value;
//   Pet.updatePet(body)
//     .then(function (response) {
//       utils.writeJson(res, response);
//     })
//     .catch(function (response) {
//       utils.writeJson(res, response);
//     });
// };

// module.exports.updatePetWithForm = function updatePetWithForm(req, res, next) {
//   var petId = req.swagger.params["petId"].value;
//   var name = req.swagger.params["name"].value;
//   var status = req.swagger.params["status"].value;
//   Pet.updatePetWithForm(petId, name, status)
//     .then(function (response) {
//       utils.writeJson(res, response);
//     })
//     .catch(function (response) {
//       utils.writeJson(res, response);
//     });
// };

// module.exports.uploadFile = function uploadFile(req, res, next) {
//   var petId = req.swagger.params["petId"].value;
//   var additionalMetadata = req.swagger.params["additionalMetadata"].value;
//   var file = req.swagger.params["file"].value;
//   Pet.uploadFile(petId, additionalMetadata, file)
//     .then(function (response) {
//       utils.writeJson(res, response);
//     })
//     .catch(function (response) {
//       utils.writeJson(res, response);
//     });
// };
