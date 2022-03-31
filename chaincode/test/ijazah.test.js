'use strict';

const Chaincode = require('../src/chaincode')

const sinon = require('sinon')
const chai = require('chai')
const sinonChai = require('sinon-chai')
const expect = chai.expect
const bcrypt = require('bcrypt')
const stringify = require('json-stringify-deterministic')
const sortKey = require('sort-keys-recursive')

const { Context } = require('fabric-contract-api')
const { ChaincodeStub } = require('fabric-shim')
const uuid = require('uuid')

let assert = sinon.assert
chai.use(sinonChai)

describe('E-jazah chaincode test', () => {
    let transactionContext, chaincodeStub, adminUser;
    beforeEach(() => {
        transactionContext = new Context()

        chaincodeStub = sinon.createStubInstance(ChaincodeStub)
        transactionContext.setChaincodeStub(chaincodeStub);

        chaincodeStub.putState.callsFake((key, value) => {
            if (!chaincodeStub.states) {
                chaincodeStub.states = {};
            }
            chaincodeStub.states[key] = value;
        });

        chaincodeStub.getState.callsFake(async (key) => {
            let ret;
            if (chaincodeStub.states) {
                ret = chaincodeStub.states[key];
            }
            return Promise.resolve(ret);
        });

        chaincodeStub.deleteState.callsFake(async (key) => {
            if (chaincodeStub.states) {
                delete chaincodeStub.states[key];
            }
            return Promise.resolve(key);
        });

        chaincodeStub.getStateByRange.callsFake(async () => {
            function* internalGetStateByRange() {
                if (chaincodeStub.states) {
                    // Shallow copy
                    const copied = Object.assign({}, chaincodeStub.states);

                    for (let key in copied) {
                        yield {value: copied[key]};
                    }
                }
            }

            return Promise.resolve(internalGetStateByRange());
        });

        chaincodeStub.getTxTimestamp.callsFake(() => {
            return {
                "seconds" : {
                    "low" : 10,
                },
                "nanos" : 10
            }
        });

        chaincodeStub.getTxID.callsFake(() => {
            return uuid.v1()
        })

        adminUser = {
            ID : 'admin',
            Role : 'admin',
            docType : 'user'
        }
    })

    describe('Test create ijazah PT', () => {
        it ('ijazah should created', async() => {
            let cc = new Chaincode()
            await cc.InitLedger(transactionContext)
            await cc.StudentInitTest(transactionContext)
            await cc.CreateIjazahPT(
                transactionContext,
                'itb@gmail.com',
                '340401999',
                '13518019',
                'Teknik Informatika',
                'Sarjana Teknik',
                'S.T.',
                '29-06-2022',
                '15-07-2022',
                'Reini',
                'Basis Data:3:A,Kerja Praktik:2:A'
            )
            let res = await chaincodeStub.getState('PT-340401999')
            let resObject = JSON.parse(res)
            expect(resObject.ID).equal('PT-340401999')
        })

        it ('ijazah should error', async() => {
            let cc = new Chaincode()
            await cc.InitLedger(transactionContext)
            await cc.StudentInitTest(transactionContext)
            try {
                await cc.CreateIjazahPT(
                    transactionContext,
                    'ugm@gmail.com',
                    '340401999',
                    '13518019',
                    'Teknik Informatika',
                    'Sarjana Teknik',
                    'S.T.',
                    '29-06-2022',
                    '15-07-2022',
                    'Reini',
                    'Basis Data:3:A,Kerja Praktik:2:A'
                )
            } catch (error) {
                expect(error.toString()).equal('Error: User ugm@gmail.com does not exist')
            }
        })
    })

    describe('Test create ijazah Lower Education', () => {
        it ('ijazah should created', async() => {
            let cc = new Chaincode()
            await cc.InitLedger(transactionContext)
            await cc.StudentInitTest(transactionContext)
            await cc.CreateIjazahLowerEducation(
                transactionContext,
                'sdbmd@gmail.com',
                '1234567890',
                '2300',
                '29-06-2022',
                '15-07-2022',
                'Suharno',
                'Bahasa Indonesia:9.30,Matematika:9'
            )
            let res = await chaincodeStub.getState('SD-1234567890')
            let resObject = JSON.parse(res)
            expect(resObject.ID).equal('SD-1234567890')
        })

    })

    describe('Test verify ijazah', () => {
        it('Ijazah verified PT', async() => {
            let cc = new Chaincode()
            await cc.InitLedger(transactionContext)
            await cc.StudentInitTest(transactionContext)
            let cert = await cc.CreateIjazahLowerEducation(
                transactionContext,
                'sdbmd@gmail.com',
                '1234567890',
                '2300',
                '29-06-2022',
                '15-07-2022',
                'Suharno',
                'Bahasa Indonesia:9.30,Matematika:9'
            )
            let certObject = JSON.parse(cert)
            delete certObject.InstitutionEmail
            delete certObject.Signature
            delete certObject.docType

            let result = await cc.VerifyIjazahContent(transactionContext, 'SD-1234567890', stringify(sortKey(certObject)))
            expect(result).equal("true")
        })

        it('Ijazah verified PT', async() => {
            let cc = new Chaincode()
            await cc.InitLedger(transactionContext)
            await cc.StudentInitTest(transactionContext)
            let cert = await cc.CreateIjazahPT(
                transactionContext,
                'itb@gmail.com',
                '340401999',
                '13518019',
                'Teknik Informatika',
                'Sarjana Teknik',
                'S.T.',
                '29-06-2022',
                '15-07-2022',
                'Reini',
                'Basis Data:3:A,Kerja Praktik:2:A'
            )
            let certObject = JSON.parse(cert)
            delete certObject.InstitutionEmail
            delete certObject.Signature
            delete certObject.docType

            let result = await cc.VerifyIjazahContent(transactionContext, 'PT-340401999', stringify(sortKey(certObject)))
            expect(result).equal("true")
        })

        it('Ijazah not verified', async() => {
            let cc = new Chaincode()
            await cc.InitLedger(transactionContext)
            await cc.StudentInitTest(transactionContext)
            let cert = await cc.CreateIjazahPT(
                transactionContext,
                'itb@gmail.com',
                '340401999',
                '13518019',
                'Teknik Informatika',
                'Sarjana Teknik',
                'S.T.',
                '29-06-2022',
                '15-07-2022',
                'Reini',
                'Basis Data:3:A,Kerja Praktik:2:A'
            )
            let certObject = JSON.parse(cert)
            delete certObject.InstitutionEmail
            delete certObject.Signature
            delete certObject.docType
            certObject.LeaderName = 'Reina'

            let result = await cc.VerifyIjazahContent(transactionContext, 'PT-340401999', stringify(sortKey(certObject)))
            expect(result).equal("false")
        })
    })

    describe('Test get ijazah by student', () => {
        it('Get 2', async() => {
            let cc = new Chaincode()
            await cc.InitLedger(transactionContext)
            await cc.StudentInitTest(transactionContext)
            await cc.CreateIjazahLowerEducation(
                transactionContext,
                'sdbmd@gmail.com',
                '340401999',
                '2300',
                '29-06-2022',
                '15-07-2022',
                'Suharno',
                'Bahasa Indonesia:9.30,Matematika:9'
            )
            await cc.CreateIjazahPT(
                transactionContext,
                'itb@gmail.com',
                '340401999',
                '13518019',
                'Teknik Informatika',
                'Sarjana Teknik',
                'S.T.',
                '29-06-2022',
                '15-07-2022',
                'Reini',
                'Basis Data:3:A,Kerja Praktik:2:A'
            )
            let res = await cc.GetIjazahByUser(transactionContext, '340401999')
            let resObj = JSON.parse(res)
            expect(resObj.length).equal(2)
        })
    })

    describe('Test get ijazah by institution', () => {
        it('Get 2', async() => {
            let cc = new Chaincode()
            await cc.InitLedger(transactionContext)
            await cc.StudentInitTest(transactionContext)
            await cc.CreateIjazahLowerEducation(
                transactionContext,
                'sdbmd@gmail.com',
                '340401999',
                '2300',
                '29-06-2022',
                '15-07-2022',
                'Suharno',
                'Bahasa Indonesia:9.30,Matematika:9'
            )
            let res = await cc.GetIjazahByInstitution(transactionContext, 'sdbmd@gmail.com')
            let resObj = JSON.parse(res)
            expect(resObj.length).equal(1)
        })
    })

    describe('Test get all ijazah', () => {
        it('Get 2', async() => {
            let cc = new Chaincode()
            await cc.InitLedger(transactionContext)
            await cc.StudentInitTest(transactionContext)
            await cc.CreateIjazahLowerEducation(
                transactionContext,
                'sdbmd@gmail.com',
                '340401999',
                '2300',
                '29-06-2022',
                '15-07-2022',
                'Suharno',
                'Bahasa Indonesia:9.30,Matematika:9'
            )
            await cc.CreateIjazahPT(
                transactionContext,
                'itb@gmail.com',
                '1234567890',
                '13518019',
                'Teknik Informatika',
                'Sarjana Teknik',
                'S.T.',
                '29-06-2022',
                '15-07-2022',
                'Reini',
                'Basis Data:3:A,Kerja Praktik:2:A'
            )
            let res = await cc.GetAllIjazah(transactionContext)
            let resObj = JSON.parse(res)
            expect(resObj.length).equal(2)
        })
    })
})