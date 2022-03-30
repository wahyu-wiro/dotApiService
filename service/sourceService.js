"use strict";
var mongoose = require("mongoose").set("debug", true),
  mongoConf = require("../config/mongo.js"),
  paramTemp = "";

const templateSource = require("../config/mongooseSchema");

async function getMongoosedata(collection, param) {
  let query = "";

  switch (collection) {
    case "template":
      query = await templateSource.findOne(param);
      return query;
      break;
  }
}

async function getSource(filter) {
  let paramDb = {
      category: "page",
      status: "active",
      templateName: filter.source,
    },
    result = await getMongoosedata("template", paramDb);
  if (result) {
    return result.source;
  } else {
    return "tidak ada";
  }
}

exports.landingSource_v1 = function () {
  return new Promise(async function (resolve, reject) {
    paramTemp = { source: "landing" };
    resolve(await getSource(paramTemp));
  });
};

exports.signinForm_v1 = function (request) {
  return new Promise(async function (resolve, reject) {
    let param = "";
    switch (request) {
      case "permission":
        resolve("OK");
        break;
      default:
        param = { source: "signin", continue: request };
        resolve(await getSource(param));
        break;
    }
  });
};

// exports.addPet = function (body) {
//   return new Promise(function (resolve, reject) {
//     resolve();
//   });
// };

// /**
//  * Deletes a pet
//  *
//  *
//  * petId Long Pet id to delete
//  * api_key String  (optional)
//  * no response value expected for this operation
//  **/
// exports.deletePet = function (petId, api_key) {
//   return new Promise(function (resolve, reject) {
//     resolve();
//   });
// };

// /**
//  * Finds Pets by status
//  * Multiple status values can be provided with comma separated strings
//  *
//  * status List Status values that need to be considered for filter
//  * returns List
//  **/

// /**
//  * Finds Pets by tags
//  * Muliple tags can be provided with comma separated strings. Use         tag1, tag2, tag3 for testing.
//  *
//  * tags List Tags to filter by
//  * returns List
//  **/
// exports.findPetsByTags = function (tags) {
//   return new Promise(function (resolve, reject) {
//     var examples = {};
//     examples["application/json"] = [{
//         photoUrls: ["photoUrls", "photoUrls"],
//         name: "doggie",
//         id: 0,
//         category: {
//           name: "name",
//           id: 6,
//         },
//         tags: [{
//             name: "name",
//             id: 1,
//           },
//           {
//             name: "name",
//             id: 1,
//           },
//         ],
//         status: "available",
//       },
//       {
//         photoUrls: ["photoUrls", "photoUrls"],
//         name: "doggie",
//         id: 0,
//         category: {
//           name: "name",
//           id: 6,
//         },
//         tags: [{
//             name: "name",
//             id: 1,
//           },
//           {
//             name: "name",
//             id: 1,
//           },
//         ],
//         status: "available",
//       },
//     ];
//     if (Object.keys(examples).length > 0) {
//       resolve(examples[Object.keys(examples)[0]]);
//     } else {
//       resolve();
//     }
//   });
// };

// /**
//  * Find pet by ID
//  * Returns a single pet
//  *
//  * petId Long ID of pet to return
//  * returns Pet
//  **/
// exports.getPetById = function (petId) {
//   return new Promise(function (resolve, reject) {
//     var examples = {};
//     examples["application/json"] = {
//       photoUrls: ["photoUrls", "photoUrls"],
//       name: "doggie",
//       id: 0,
//       category: {
//         name: "name",
//         id: 6,
//       },
//       tags: [{
//           name: "name",
//           id: 1,
//         },
//         {
//           name: "name",
//           id: 1,
//         },
//       ],
//       status: "available",
//     };
//     if (Object.keys(examples).length > 0) {
//       resolve(examples[Object.keys(examples)[0]]);
//     } else {
//       resolve();
//     }
//   });
// };

// /**
//  * Update an existing pet
//  *
//  *
//  * body Pet Pet object that needs to be added to the store
//  * no response value expected for this operation
//  **/
// exports.updatePet = function (body) {
//   return new Promise(function (resolve, reject) {
//     resolve();
//   });
// };

// /**
//  * Updates a pet in the store with form data
//  *
//  *
//  * petId Long ID of pet that needs to be updated
//  * name String Updated name of the pet (optional)
//  * status String Updated status of the pet (optional)
//  * no response value expected for this operation
//  **/
// exports.updatePetWithForm = function (petId, name, status) {
//   return new Promise(function (resolve, reject) {
//     resolve();
//   });
// };

// /**
//  * uploads an image
//  *
//  *
//  * petId Long ID of pet to update
//  * additionalMetadata String Additional data to pass to server (optional)
//  * file File file to upload (optional)
//  * returns ApiResponse
//  **/
// exports.uploadFile = function (petId, additionalMetadata, file) {
//   return new Promise(function (resolve, reject) {
//     var examples = {};
//     examples["application/json"] = {
//       code: 0,
//       type: "type",
//       message: "message",
//     };
//     if (Object.keys(examples).length > 0) {
//       resolve(examples[Object.keys(examples)[0]]);
//     } else {
//       resolve();
//     }
//   });
// };
