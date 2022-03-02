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

// const { privateKey, publicKey } = generateKeyPair()
// signature = sign("Besok jumat", privateKey)

// console.log(verify("Besok jumat", signature, publicKey))

module.exports = {
    generateKeyPair,
    sign,
    verify
}