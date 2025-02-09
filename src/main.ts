import createSlot from "@/api/appointments/slots/createSlot";
import {add} from "date-fns";
import getAccessToken from "@/api/auth/getAccessToken";
import createProvider from "@/api/providers/createProvider";
import createPatient from "@/api/patients/createPatient";
import createAppointment from "@/api/appointments/createAppointment";

const main = async () => {
    // console.log(await getAccessToken(CLIENT_ID, CLIENT_SECRET))

    // const provider = await createProvider(195900, {
    //     firstName: 'Yihong',
    //     lastName: 'Lee'
    // })
    //
    // console.log({provider})

    const patient = await createPatient(195900, {
        firstName: 'Albert',
        lastName: 'Sheng',
    })

    const slot = await createSlot(
        195900,
        {
            providerId: 1,
            departmentId: 1,
            date: add(new Date(), {days: 2})
        }
    )

    console.log({patient, slot})

    const appointment = await createAppointment(195900, {
        patientId: patient,
        slotId: slot.id
    })

    console.log({appointment})

}

main()