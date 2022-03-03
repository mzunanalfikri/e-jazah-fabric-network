const crypto = require('crypto')

function generateKeyPair(){

    // const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    //     modulusLength: 2048,
    // });

    const keyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: "pkcs1",
            format: "pem",
          },
          privateKeyEncoding: {
            type: "pkcs1",
            format: "pem",
          },
    });

    return keyPair
}

function sign(content, privateKey){
    const data = Buffer.from(content)

    const sign = crypto.sign("SHA256", data, privateKey)

    return sign.toString('base64')
}

function verify(content, signature, publicKey){
    const data = Buffer.from(content)

    return crypto.verify("SHA256", data, publicKey, Buffer.from(signature, 'base64'))
}

const hash8digit = function(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
    h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1>>>0);
};

// const { privateKey, publicKey } = generateKeyPair()
// console.log(privateKey)
// console.log(publicKey)
// signature = sign("Besok jumat", privateKey)

// console.log(verify("Besok jumat", signature, publicKey))

// var hash = crypto.createHash('md5').update("lalla").digest('hex');
// console.log(hash.slice(0,8))
module.exports = {
    generateKeyPair,
    sign,
    verify,
    hash8digit
}