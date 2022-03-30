'use strict';
var mongoose = require('mongoose').set('debug', true);
const Schema = mongoose.Schema;

const templateSchema = new Schema({
    category: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    templateName: {
        type: String,
        required: true
    },
    source: {
        type: String,
        required: false
    },
    status: {
        type: String,
        required: true
    },
    phoneCode: {
        type: String,
        required: false
    },
    phone: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    otplevel: {
        type: Number,
        required: true
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
const templateSource = mongoose.model('templateSource', templateSchema, 'templateSource');
module.exports = templateSource;