'use strict';

const stringify = require('json-stringify-deterministic')
const sortKey = require('sort-keys-recursive')
const uuid = require('uuid')
const bcrypt = require('bcrypt')
var generator = require('generate-password');
const { Contract } = require('fabric-contract-api')
const ADMIN_ROLE = 'admin'
const STUDENT_ROLE = 'siswa'
const INSTITUTION_ROLE = 'institusi'
const SALT = 10

class Chaincode extends Contract {

    // tested
    async InitLedger(ctx) {
        const admin = {
            ID : 'admin',
            Name : 'admin',
            Password : bcrypt.hashSync('admin', SALT),
            Role : ADMIN_ROLE,
            docType : 'user'
        }
        await ctx.stub.putState(admin.ID, Buffer.from(stringify(sortKey(admin))))
    }

    // tested
    async IsAssetExist(ctx, id){
        const assetJSON = await ctx.stub.getState(id)
        if (assetJSON === undefined){
            return false
        } 
        return true
    }

    // tested
    async CreateStudent(ctx, authUser, nik, name, birthPlace, birthDate) {
        const exists = await this.IsAssetExist(ctx, nik)
        if (exists){
            throw new Error(`Student ${nik} already exist`)
        }

        const role = await this.GetUserRole(ctx, authUser)
        if (role != INSTITUTION_ROLE){
            throw new Error(`User ${authUser} is not institution`)
        }

        const password = generator.generate({length:10, numbers: true})
        const student = {
            ID: nik,
            Name : name,
            Password : bcrypt.hashSync(password, SALT),
            BirthDate : birthPlace,
            BirthPlace : birthDate,
            LinkOn : false,
            Role : STUDENT_ROLE,
            docType: "user"
        }

        await ctx.stub.putState(student.ID, Buffer.from(stringify(sortKey(student))))
        await this.AddLog(ctx, authUser, `${authUser} create ${nik} student account.`)
        return JSON.stringify({
            ...student,
            PlainPassword : password
        })
    }

    // tested
    async CreateInstitution(ctx, authUser, institutionEmail, name, grade, city, province){
        const exist = await this.IsAssetExist(ctx, institutionEmail)
        if (exist) {
            throw new Error(`Institution ${name} with email ${institutionEmail} already exist`)
        }

        const role = await this.GetUserRole(ctx, authUser)
        if (role != ADMIN_ROLE){
            throw new Error(`User ${authUser} is not an admin`)
        }

        const password = generator.generate({length:10, numbers: true})
        const institution = {
            ID : institutionEmail, 
            Name : name,
            Password : bcrypt.hashSync(password, SALT),
            Grade : grade,
            City : city,
            Province : province,
            Role : INSTITUTION_ROLE,
            docType : "user"
        }

        await ctx.stub.putState(institution.ID, Buffer.from(stringify(sortKey(institution))))
        await this.AddLog(ctx, authUser, `${authUser} create ${name} institution account with email ${institutionEmail}.`)
        return JSON.stringify({
            ...institution,
            PlainPassword : password
        })
    }

    // tested
    async CheckUserCredential(ctx, id, password){
        const user = await this.GetUserById(ctx, id)
        let userObject = JSON.parse(user.toString())
        if (!bcrypt.compareSync(password, userObject.Password)){
            throw new Error("Wrong password")
        }
        return JSON.stringify(userObject)
    }

    // tested
    async GetUserRole(ctx, id){
        const user = await ctx.stub.getState(id)
        if (!user || user.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        const userObject = JSON.parse(user.toString())
        return userObject["Role"]
    }

    // tested
    async GetUserById(ctx, id){
        const user = await ctx.stub.getState(id)
        if (!user || user.length === 0) {
            throw new Error(`User ${id} does not exist`);
        }
        return user.toString()
    }

    // tested
    async UpdateUserPassword(ctx, id, newPassword){
        const user = await this.GetUserById(ctx, id)
        let userObject = JSON.parse(user)

        userObject.Password = bcrypt.hashSync(newPassword, SALT)
        await ctx.stub.putState(id, Buffer.from(stringify(sortKey(userObject))))
        await this.AddLog(ctx, id, `${id} changed user password.`)
        return JSON.stringify(userObject)
    }

    // tested
    async ChangeStatusStudentIjazahLink(ctx, id){
        const user = await this.GetUserById(ctx, id)
        let userObject = JSON.parse(user)

        userObject.LinkOn = !userObject.LinkOn
        await ctx.stub.putState(id, Buffer.from(stringify(sortKey(userObject))))
        await this.AddLog(ctx, id, `${id} change link status to ${userObject.LinkOn}`)
        return JSON.stringify(userObject)
    }

    async CreateIjazah(){

    }

    async GetIjazahByUser(){

    }

    // institusi only
    async GetIjazahByInstitution(){

    }

    // admin only
    async GetAllIjazah(){

    }

    async VerifyIjazah(){

    }

    // tested
    async AddLog(ctx, id, message){
        const log = {
            ID : uuid.v1(),
            subjectID : id,
            message : message,
            timestamp : new Date().toISOString(),
            docType : "log"
        }

        await ctx.stub.putState(log.ID, Buffer.from(stringify(sortKey(log))))
    }
}

module.exports = Chaincode