import createSlot from "@/api/appointments/slots/createSlot";
import {add} from "date-fns";
import getAccessToken from "@/api/auth/getAccessToken";
import createProvider from "@/api/providers/createProvider";
import createPatient from "@/api/patients/createPatient";
import createAppointment from "@/api/appointments/createAppointment";

const CLIENT_ID = '0oavy5jv043ak62Py297'
const CLIENT_SECRET = 'gQ5dpgcplwg7_sfwE2T0GHTaI1ZU2_tzy6gF1DiAOop5tDCkb-pRnHXVwsxOWlXX'

const main = async () => {
    // console.log(await getAccessToken(CLIENT_ID, CLIENT_SECRET))

    const provider = await createProvider(195900, {
        firstName: 'Yihong',
        lastName: 'Lee'
    })

    const patient = await createPatient(195900, {
        firstName: 'Albert',
        lastName: 'Sheng',
    })

    const slot = await createSlot(
        195900,
        {
            reasonId: 1301,
            providerId: provider,
            departmentId: 1,
            date: add(new Date(), {days: 1})
        }
    )

    console.log({provider, patient, slot})

    const appointment = await createAppointment(195900, {
        patientId: patient,
        slotId: slot.id
    })

    console.log({appointment})

}

main()