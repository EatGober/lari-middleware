import axios from "../../lib/axios";
import * as querystring from "node:querystring";

interface CreateProviderParams {
    firstName: string
    lastName: string

}

const createProviderParams = async (practiceId: number, {
    firstName,
    lastName
}: CreateProviderParams): Promise<number> => {
    const payload = querystring.stringify({
        billable: false,
        lastname: lastName,
        sex: "F",
        communicatorhomedepartment: 3,
        personalpronounsid: 3,
        medicalgroupid: 1,
        providergroupid: 1,
        supervisingproviderid: 3,
        practiceroleid: 1,
        ssn: 3325637245,
        npinumber: 4,
        ansicode: "251B00000X",
        entitytypeid: 1,
        scheduleresourcetypeid: 3,
        firstname: firstName,
        signatureonfileflag: true,
        schedulingname: Math.random().toString(36).substring(2, 10),
    })

    const {data} = await axios.post(`/v1/${practiceId}/providers`, payload)

    console.log({data})

    return data.providerid
}

export default createProviderParams