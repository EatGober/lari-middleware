import axios from "../../lib/axios";
import * as querystring from "node:querystring";

interface CreatePatientParams {
    firstName: string
    lastName: string
}

const createPatient = async (practiceId: number, { firstName, lastName}: CreatePatientParams): Promise<number> => {
    const payload = querystring.stringify({
        email: 'test@test.com',
        guarantoremail: 'test@test.com',
        ssn: 123456789,
        departmentid: 1,
        dob: '01/01/1988',
        firstname: firstName,
        lastname: lastName,
    })
    const { data } = await axios.post(`/v1/${practiceId}/patients`, payload)

    return parseInt(data[0].patientid)
}

export default createPatient