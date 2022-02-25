'use strict';

const Chaincode = require('../src/chaincode')

const sinon = require('sinon')
const chai = require('chai')
const sinonChai = require('sinon-chai')
const expect = chai.expect
const bcrypt = require('bcrypt')

const { Context } = require('fabric-contract-api')
const { ChaincodeStub } = require('fabric-shim')

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

        adminUser = {
            ID : 'admin',
            Role : 'admin',
            docType : 'user'
        }
    })

    describe('Test initLedger', () => {
        it('should return success on InitLedger', async () => {
            let cc = new Chaincode();
            await cc.InitLedger(transactionContext);
            let res = await chaincodeStub.getState('admin')
            let ret = JSON.parse(res.toString());
            let newRet = {
                ID : ret.ID,
                Role : ret.Role,
                docType : ret.docType
            }
            let result = bcrypt.compareSync('admin', ret.Password)
            expect(newRet).to.eql(adminUser);
            expect(result).to.equal(true)
        });
        
        it('should return error on InitLedger', async () => {
            chaincodeStub.putState.rejects('failed inserting key');
            let cc = new Chaincode();
            try {
                await cc.InitLedger(transactionContext);
                assert.fail('InitLedger should have failed');
            } catch (err) {
                expect(err.name).to.equal('failed inserting key');
            }
        });
    })

    describe('Test Is Asset Exist', () => {
        it ('Should return true', async () => {
            let cc = new Chaincode();
            await cc.InitLedger(transactionContext)
            let res = await cc.IsAssetExist(transactionContext, 'admin')
            expect(res).to.eql(true)
        })

        it ('Should return false', async () => {
            let cc = new Chaincode();
            await cc.InitLedger(transactionContext)
            let res = await cc.IsAssetExist(transactionContext, 'zzaa@gmail.com')
            expect(res).to.equal(false)
        })
    })

    describe('Test create institution', () => {
        it ('Should created', async() => {
            let cc = new Chaincode()
            await cc.InitLedger(transactionContext)
            let res = await cc.CreateInstitution(transactionContext, 'admin', 'sdbmd@gmail.com', 'SD Budi Mulia', 'SD', 'Sleman', 'DIY')
            let resObject = JSON.parse(res)
            expect(resObject.Name).to.equal("SD Budi Mulia")
        })

        it ('Should error', async() => {
            let cc = new Chaincode()
            await cc.InitLedger(transactionContext)
            try {
                let res = await cc.CreateInstitution(transactionContext, 'admin1', 'sdbmd@gmail.com', 'SD Budi Mulia', 'SD', 'Sleman', 'DIY')
                let resObject = JSON.parse(res)
                expect(resObject.Name).to.equal("SD Budi Mulia")
            } catch (err) {
                expect(err.toString()).equal("Error: The asset admin1 does not exist")
            }
        })

        it ('Should error', async() => {
            let cc = new Chaincode()
            await cc.InitLedger(transactionContext)
            await cc.CreateInstitution(transactionContext, 'admin', 'sdbmd@gmail.com', 'SD Budi Mulia', 'SD', 'Sleman', 'DIY')
            try {
                let res = await cc.CreateInstitution(transactionContext, 'admin', 'sdbmd@gmail.com', 'SD Budi Mulia', 'SD', 'Sleman', 'DIY')
                let resObject = JSON.parse(res)
                expect(resObject.Name).to.equal("SD Budi Mulia")
            } catch (err) {
                expect(err.toString()).equal("Error: Institution SD Budi Mulia with email sdbmd@gmail.com already exist")
            }
        })
    })

    describe("Test create student", () => {
        it ('Should created', async() => {
            let cc = new Chaincode()
            await cc.InitLedger(transactionContext)
            await cc.CreateInstitution(transactionContext, 'admin', 'sdbmd@gmail.com', 'SD Budi Mulia', 'SD', 'Sleman', 'DIY')
            let res = await cc.CreateStudent(transactionContext,'sdbmd@gmail.com', '1234567890','Ahmad Maulana', 'Sleman','29-09-2008' )
            let resObject = JSON.parse(res)
            expect(resObject.Name).equal("Ahmad Maulana")
        })

        it ('Should error', async () => {
            let cc = new Chaincode()
            await cc.InitLedger(transactionContext)
            await cc.CreateInstitution(transactionContext, 'admin', 'sdbmd@gmail.com', 'SD Budi Mulia', 'SD', 'Sleman', 'DIY')
            try {
                let res = await cc.CreateStudent(transactionContext,'admin', '1234567890','Ahmad Maulana', 'Sleman','29-09-2008' )
            } catch (error) {
                expect(error.toString()).equal('Error: User admin is not institution')
            }
        })

        it ('Should error', async () => {
            let cc = new Chaincode()
            await cc.InitLedger(transactionContext)
            await cc.CreateInstitution(transactionContext, 'admin', 'sdbmd@gmail.com', 'SD Budi Mulia', 'SD', 'Sleman', 'DIY')
            await cc.CreateStudent(transactionContext,'sdbmd@gmail.com', '1234567890','Ahmad Maulana', 'Sleman','29-09-2008' )
            try {
                let res = await cc.CreateStudent(transactionContext,'admin', '1234567890','Ahmad Maulana', 'Sleman','29-09-2008' )
            } catch (error) {
                expect(error.toString()).equal('Error: Student 1234567890 already exist')
            }
        })

        describe('Test check credential', () => {
            it ('should return user', async() => {
                let cc = new Chaincode()
                await cc.InitLedger(transactionContext)
                let res = await cc.CheckUserCredential(transactionContext, 'admin', 'admin')
                let resObject = JSON.parse(res)
                expect(resObject.Name).equal('admin')
            })

            it ('should return error', async() => {
                let cc = new Chaincode()
                await cc.InitLedger(transactionContext)
                try {
                    let res = await cc.CheckUserCredential(transactionContext, 'admin', 'adminpass')
                    let resObject = JSON.parse(res)
                    expect(resObject.Name).equal('admin')
                } catch (error) {
                    expect(error.toString()).equal('Error: Wrong password')
                }
            })
        })
    })
})