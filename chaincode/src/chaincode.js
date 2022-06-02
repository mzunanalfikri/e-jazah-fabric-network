'use strict';

const stringify = require('json-stringify-deterministic')
const sortKey = require('sort-keys-recursive')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const pki = require('./pki')
const { Contract } = require('fabric-contract-api')
const ADMIN_ROLE = 'admin'
const STUDENT_ROLE = 'student'
const INSTITUTION_ROLE = 'institution'
const SALT = "$2b$10$jTyPa7Z7jE/O4wAOXrFpLe"

class Chaincode extends Contract {

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

    async IsAssetExist(ctx, id){
        const assetJSON = await ctx.stub.getState(id)
        return assetJSON && assetJSON.length > 0;
    }

    async CreateStudent(ctx, authUser, nik, name, birthPlace, birthDate) {
        const exists = await this.IsAssetExist(ctx, nik)
        if (exists){
            throw new Error(`Student ${nik} already exist`)
        }

        const role = await this.GetUserRole(ctx, authUser)
        if (role != INSTITUTION_ROLE){
            throw new Error(`User ${authUser} is not institution`)
        }

        const password = (crypto.createHash('md5').update(nik).digest('hex')).slice(0,8)
        const student = {
            ID: nik,
            Name : name,
            Password : bcrypt.hashSync(password, SALT),
            BirthPlace : birthPlace,
            BirthDate : birthDate,
            LinkOn : false,
            Role : STUDENT_ROLE,
            docType: "user"
        }

        await ctx.stub.putState(student.ID, Buffer.from(stringify(sortKey(student))))
        await this.AddLog(ctx, authUser, `${authUser} create ${nik} student account.`)
        delete student.Password
        return JSON.stringify({
            ...student,
            PlainPassword : password
        })
    }

    async CreateInstitution(ctx, authUser, institutionEmail, name, level, city, province, privateKey, publicKey){
        const exist = await this.IsAssetExist(ctx, institutionEmail)
        if (exist) {
            throw new Error(`Institution ${name} with email ${institutionEmail} already exist`)
        }

        const role = await this.GetUserRole(ctx, authUser)
        if (role != ADMIN_ROLE){
            throw new Error(`User ${authUser} is not an admin`)
        }

        const password = (crypto.createHash('md5').update(institutionEmail).digest('hex')).slice(0,8)
        // const { privateKey, publicKey } = pki.generateKeyPair()
        const institution = {
            ID : institutionEmail, 
            Name : name,
            Password : bcrypt.hashSync(password, SALT),
            Level : level,
            City : city,
            Province : province,
            Role : INSTITUTION_ROLE,
            PrivateKey : privateKey,
            PublicKey : publicKey,
            docType : "user"
        }

        await ctx.stub.putState(institution.ID, Buffer.from(stringify(sortKey(institution))))
        await this.AddLog(ctx, authUser, `${authUser} create ${name} institution account with email ${institutionEmail}.`)
        delete institution.Password
        delete institution.PrivateKey
        delete institution.PublicKey
        return JSON.stringify({
            ...institution,
            PlainPassword : password
        })
    }

    async CheckUserCredential(ctx, id, password){
        const user = await this.GetUserById(ctx, id)
        let userObject = JSON.parse(user.toString())
        if (!bcrypt.compareSync(password, userObject.Password)){
            throw new Error("Wrong password")
        }
        delete userObject.Password
        return JSON.stringify(userObject)
    }

    async GetUserRole(ctx, id){
        const user = await ctx.stub.getState(id)
        if (!user || user.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        const userObject = JSON.parse(user.toString())
        return userObject["Role"]
    }

    async GetUserById(ctx, id){
        const user = await ctx.stub.getState(id)
        if (!user || user.length === 0) {
            throw new Error(`User ${id} does not exist`);
        }
        return user.toString()
    }

    async GetUserProfile(ctx, id){
        const user = await ctx.stub.getState(id)
        if (!user || user.length === 0) {
            throw new Error(`User ${id} does not exist`);
        }
        const userObject = JSON.parse(user.toString())
        delete userObject.Password
        delete userObject.PublicKey
        delete userObject.PrivateKey
        return JSON.stringify(userObject)
    }

    async UpdateUserPassword(ctx, id, oldPassword, newPassword){
        const user = await this.GetUserById(ctx, id)
        let userObject = JSON.parse(user)

        if (userObject.Password != bcrypt.hashSync(oldPassword, SALT)){
            throw new Error('Password lama salah')
        }

        userObject.Password = bcrypt.hashSync(newPassword, SALT)
        await ctx.stub.putState(id, Buffer.from(stringify(sortKey(userObject))))
        await this.AddLog(ctx, id, `${id} changed user password.`)
        delete userObject.Password
        delete userObject.PrivateKey
        delete userObject.PublicKey
        return JSON.stringify(userObject)
    }

    async ChangeStatusStudentIjazahLink(ctx, id){
        const user = await this.GetUserById(ctx, id)
        let userObject = JSON.parse(user)

        userObject.LinkOn = !userObject.LinkOn
        await ctx.stub.putState(id, Buffer.from(stringify(sortKey(userObject))))
        await this.AddLog(ctx, id, `${id} change link status to ${userObject.LinkOn}`)
        return JSON.stringify(userObject)
    }

    async CreateIjazahPT(ctx, authUser, nik, studNumber, tingkat, prodi, gelar, singkatan, gradDate, issueDate, leaderName, predikat){
        let student = JSON.parse(await this.GetUserById(ctx, nik))
        let institution = JSON.parse(await this.GetUserById(ctx, authUser))
        let hash = crypto.createHash('md5').update(institution.Name+tingkat+prodi).digest('hex');
        
        let id = institution.Level + "-" + student.ID + "-" + tingkat + "-" + hash.substring(1,4)
        const ijazah = await ctx.stub.getState(id)
        if (!ijazah || ijazah.length === 0) {
            console.log("Ijazah belum terdaftar, lanjut membuat ...")
        } else {
            throw new Error(`Ijazah dengan ${id} telah terdaftar`);
        }
        
        let certificate = {
            ID : id,
            InstitutionName : institution.Name,
            Province : institution.Province,
            City : institution.City,
            Level : institution.Level,
            StudentName : student.Name,
            BirthPlace : student.BirthPlace,
            BirthDate : student.BirthDate,
            NIK : student.ID,
            Tingkat : tingkat,
            StudentNumber : studNumber,
            Prodi : prodi,
            Gelar : gelar,
            SingkatanGelar : singkatan,
            GraduationDate : gradDate,
            IssueDate : issueDate,
            LeaderName : leaderName,
            Predikat : predikat
            // IPK : ipk,
            // Grade : grade //need to parse
        }

        let signature = pki.sign(stringify(sortKey(certificate)), institution.PrivateKey)
        certificate["Signature"] = signature
        // not included in signature
        certificate["InstitutionEmail"] = authUser
        certificate["docType"] = "ijazah"

        await ctx.stub.putState(certificate.ID, Buffer.from(stringify(sortKey(certificate))))
        await this.AddLog(ctx, authUser, `${authUser} create ijazah with id ${id}.`)
        return JSON.stringify(certificate)
    }

    async CreateIjazahLowerEducation(ctx, authUser, nik, studNumber, gradDate, issueDate, leaderName, grade){
        let student = JSON.parse(await this.GetUserById(ctx, nik))
        let institution = JSON.parse(await this.GetUserById(ctx, authUser))

        let id = institution.Level + "-" + student.ID
        const ijazah = await ctx.stub.getState(id)
        if (!ijazah || ijazah.length === 0) {
            console.log("Ijazah belum terdaftar, lanjut membuat ...")
        } else {
            throw new Error(`Ijazah dengan ${id} telah terdaftar`);
        }
        let certificate = {
            ID : id,
            InstitutionName : institution.Name,
            Province : institution.Province,
            City : institution.City,
            Level : institution.Level,
            StudentName : student.Name,
            BirthPlace : student.BirthPlace,
            BirthDate : student.BirthDate,
            NIK : student.ID,
            StudentNumber : studNumber,
            GraduationDate : gradDate,
            IssueDate : issueDate,
            LeaderName : leaderName,
            Grade : grade //need to parse
        }

        let signature = pki.sign(stringify(sortKey(certificate)), institution.PrivateKey)
        certificate["Signature"] = signature
        // not included in signature
        certificate["InstitutionEmail"] = authUser
        certificate["docType"] = "ijazah"

        await ctx.stub.putState(certificate.ID, Buffer.from(stringify(sortKey(certificate))))
        await this.AddLog(ctx, authUser, `${authUser} create ijazah with id ${id}.`)
        return JSON.stringify(certificate)
    }

    async GetIjazahById(ctx, id){
        const ijazah = await ctx.stub.getState(id)
        if (!ijazah || ijazah.length === 0) {
            throw new Error(`Ijazah ${id} does not exist`);
        }
        return ijazah.toString()
    }

    async GetIjazahByUserCheckLink(ctx, id){
        let allResult = []
        let iterator = await ctx.stub.getStateByRange('','')
        let result = await iterator.next()
        let user = JSON.parse(await this.GetUserById(ctx, id))
        if (user.LinkOn) {
            while (!result.done){
                let strObj = Buffer.from(result.value.value.toString()).toString('utf8')
                let obj = JSON.parse(strObj)
                // console.log(obj)
                if (obj.docType == 'ijazah' && obj.NIK == id){
                    allResult.push(obj)
                }
    
                result = await iterator.next()
            }
            return JSON.stringify(allResult)
        } else {
            throw new Error('User link off')
        }
    }

    async GetIjazahByUser(ctx, id){
        let allResult = []
        let iterator = await ctx.stub.getStateByRange('','')
        let result = await iterator.next()
        while (!result.done){
            let strObj = Buffer.from(result.value.value.toString()).toString('utf8')
            let obj = JSON.parse(strObj)
            // console.log(obj)
            if (obj.docType == 'ijazah' && obj.NIK == id){
                allResult.push(obj)
            }

            result = await iterator.next()
        }
        return JSON.stringify(allResult)
    }

    async GetIjazahByInstitution(ctx, id){
        let allResult = []
        let iterator = await ctx.stub.getStateByRange('','')
        let result = await iterator.next()
        while (!result.done){
            let strObj = Buffer.from(result.value.value.toString()).toString('utf8')
            let obj = JSON.parse(strObj)
            // console.log(obj)
            if (obj.docType == 'ijazah' && obj.InstitutionEmail == id){
                allResult.push(obj)
            }

            result = await iterator.next()
        }
        return JSON.stringify(allResult)
    }

    async GetAllIjazah(ctx){
        let allResult = []
        let iterator = await ctx.stub.getStateByRange('','')
        let result = await iterator.next()
        while (!result.done){
            let strObj = Buffer.from(result.value.value.toString()).toString('utf8')
            let obj = JSON.parse(strObj)
            // console.log(obj)
            if (obj.docType == 'ijazah'){
                allResult.push(obj)
            }

            result = await iterator.next()
        }
        return JSON.stringify(allResult)
    }

    async VerifyIjazahById(ctx, ijazahId){
        let ijazah = JSON.parse(await this.GetIjazahById(ctx, ijazahId))

        return JSON.stringify({
            Name : ijazah.StudentName,
            InstitutionName : ijazah.InstitutionName,
            Level : ijazah.Level,
        })
    }

    async VerifyIjazahContent(ctx, idIjazah, contentString){
        let ijazah = JSON.parse(await this.GetIjazahById(ctx, idIjazah))
        let institution = JSON.parse(await this.GetUserById(ctx, ijazah.InstitutionEmail))
        let res = pki.verify(contentString, ijazah.Signature, institution.PublicKey)
        return JSON.stringify(res)
    }

    async AddLog(ctx, id, message){
        let timestamp = ctx.stub.getTxTimestamp()
        const creationTime = Math.floor((timestamp.seconds.low + ((timestamp.nanos / 1000000) / 1000)) * 1000);
        let date = (new Date(creationTime)).toISOString()
        const log = {
            ID : ctx.stub.getTxID(),
            subjectID : id,
            message : message,
            timestamp : date,
            docType : "log"
        }

        await ctx.stub.putState(log.ID, Buffer.from(stringify(sortKey(log))))
    }

    async GetAllLog(ctx, adminId, password){
        let user = await this.CheckUserCredential(ctx, adminId, password)
        user = JSON.parse(user)
        if (user.Role != ADMIN_ROLE){
            throw new Error('Hanya admin yang bisa melihat log.')
        }

        let allResult = []
        let iterator = await ctx.stub.getStateByRange('','')
        let result = await iterator.next()
        while (!result.done){
            let strObj = Buffer.from(result.value.value.toString()).toString('utf8')
            let obj = JSON.parse(strObj)
            if (obj.docType == 'log'){
                allResult.push(obj)
            }
            result = await iterator.next()
        }
        return JSON.stringify(allResult)
    }
}

module.exports = Chaincode