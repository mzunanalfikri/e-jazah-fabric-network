'use strict';

const chaincode = require('./src/chaincode')

module.exports.Chaincode = chaincode
module.exports.contracts = [chaincode]