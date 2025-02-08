require('dotenv').config();
const { getAthenaToken } = require("./AuthUtils");
const {getPatient,getPhone} = require("./PatientUtils");
const {get } = require("axios");

async function potatotest(){

  try{
    const token = await getAthenaToken({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET
    })

  const practiceid = process.env.PRACTICE_ID;
  const patientid = "1";
  console.log(practiceid, ' this should work lol? ')
    console.log(token,'token');
  console.log( practiceid, 'practiceid');

    const phonenum = await getPhone(practiceid,patientid);
    console.log(phonenum);

  }catch (error){
    console.log('oopsies:', error.message );
  }

}

potatotest()
