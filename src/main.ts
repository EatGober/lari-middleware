import createReason from "@/api/appointments/reasons/createReason";
import createSlot from "@/api/appointments/slots/createSlot";
import {add} from "date-fns";
import getAccessToken from "@/api/auth/getAccessToken";

const CLIENT_ID = '0oavy5jv043ak62Py297'
const CLIENT_SECRET = 'gQ5dpgcplwg7_sfwE2T0GHTaI1ZU2_tzy6gF1DiAOop5tDCkb-pRnHXVwsxOWlXX'

const main = async () => {
    // console.log(await getAccessToken(CLIENT_ID, CLIENT_SECRET))

    const slot = await createSlot(
        195900,
        {
            reasonId: 1281,
            providerId: 1,
            departmentId: 1,
            date: add(new Date(), {days: 1})
        }
    )

    console.log(slot)
}

main()