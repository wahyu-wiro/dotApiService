'use strict';
var mongoose = require('mongoose').set('debug', true);
const Schema = mongoose.Schema;

/**
 * Requesting access
 * 
 *
 * body Oauth data credential guest
 * no response value expected for this operation
 **/
const otpSchema = new Schema({
    phoneCode: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    otpCode: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    deviceId: {
        type: String,
        required: false
    },
    createdAt: {
        type: String,
        required: false
    },
    createdTime: {
        type: Number,
        required: false
    },
    createdDate: {
        type: Date,
        default: Date.now
    }
});
const otp = mongoose.model('otpRequests', otpSchema);
module.exports = otp;