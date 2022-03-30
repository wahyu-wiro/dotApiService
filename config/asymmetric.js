const crypto = require('crypto');
const NodeRSA = require('node-rsa'),
fs = require('fs');

const aes_key = process.env.AES_KEY_SERVER;
const aes_iv = process.env.AES_IV_SERVER;
const pub = fs.readFileSync('./publicKey.key', 'utf8');
const priv = fs.readFileSync('./privateKey.key', 'utf8');

function decryptAes(text, aesKey = aes_key, iv = aes_iv) {
    try {
        let decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
        let decrypted = decipher.update(text, 'base64', 'utf8');
        return (decrypted + decipher.final('utf8'));
    } catch (error) {
        console.log('decryptAes: ', error);
        return false;
    }
}

function encryptAes(text, key = aes_key, iv = aes_iv) {
    try {
        let cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(text, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
    } catch (error) {
        console.log('error: ', error);
        return process.env.ERRORINTERNAL_RESPONSE;
    }
}

function encryptArrayObjectAes(array, key, iv, except = [], json = []) {
    let result = [];
    let i = 0
    for (let object of array) {
        result[i] = encryptObjectAes(object, key, iv, except, json);
        i++;
    }
    return result;
}

function encryptObjectAes(object, aeskey, iv, except = [], json = []) {
    let result = {};
    let keys;
    try {
        keys = Object.keys(object.toJSON())
    } catch (error) {
        keys = Object.keys(object);
    }
    // console.log('key: ', keys);
    for (let key of keys) {
        if (except.includes(key)) {
            result[key] = object[key]
        } else if (json.includes(key)) {
            result[key] = encryptAes(JSON.stringify(object[key]) + '', aeskey, iv)
        } else {
            result[key] = encryptAes(object[key] + '', aeskey, iv)
        }
        // result[await encrypter(key + '', clientKey)] = await encrypter(object[key] + '', clientKey)
    }
    return result;
}

function encryptArrayAes(array, aeskey, iv) {
    let result = [];
    for (let data of array) {
        result.push(encryptAes(data, aeskey, iv))
    }
    return result;
}

async function decrypterRsa(text) {
    try {
        // Decryption proccess  
        const keyPriv = new NodeRSA(priv);
        let decrypted = keyPriv.decrypt(text, 'utf8')
        return decrypted;
    } catch (err) {
        console.log('decrypterRsa: ', err);
        return false;
    }
}

async function encrypterRsa(text, clientKey) {
    try {
        if (text == null) {
            text = "null";
        }
        text += '';
        const keyPub = new NodeRSA(clientKey);
        let encrypted = keyPub.encrypt(text, 'base64');
        return encrypted;
    } catch (err) {
        console.log("text: ", text);
        console.log("clientKey: ", clientKey);
        console.log('encrypter: ', err);
        return process.env.ERRORINTERNAL_RESPONSE;
    }
}

async function encryptArrayObjectRsa(arrayObject, clientKey, except = [], json = []) {
    // console.log("arrayObject::", arrayObject); 
    let result = [];
    let i = 0
    for (let object of arrayObject) {
        result[i] = await encryptObjectRsa(object, clientKey, except, json);
        i++;
    }
    return result;
}

async function encryptObjectRsa(object, clientKey, except = [], json = []) {
    let result = {};
    let keys;
    try {
        keys = Object.keys(object.toJSON())
    } catch (error) {
        keys = Object.keys(object);
    }
    // console.log('key: ', keys);
    for (let key of keys) {
        // result[await encrypter(key + '', clientKey)] = await encrypter(object[key] + '', clientKey)
        result[key] = object[key];
        if (json.includes(key)) {
            result[key] = JSON.stringify(result[key])
        }
        if (!except.includes(key)) {
            result[key] = await encrypterRsa(result[key], clientKey)
        }
    }
    return result;
}

async function encryptArrayRsa(array, clientKey = pub) {
    let result = [];
    for (let data of array) {
       result.push(await encrypterRsa(data, clientKey))
    }
    return result;
}

module.exports = {
    encryptArrayRsa,
    encryptObjectRsa,
    encryptArrayObjectRsa,
    encrypterRsa,
    decrypterRsa,
    encryptArrayAes,
    encryptObjectAes,
    encryptArrayObjectAes,
    encryptAes,
    decryptAes
}