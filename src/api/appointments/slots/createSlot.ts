import * as querystring from "node:querystring";
import axios from "@/lib/axios";
import {AppointmentSlot} from "@/types/appointment";

interface CreateSlotParams {
    providerId: number
    departmentId: number
    //reasonId: number
    date: Date
}

const createSlot = async (practiceId: number, {
    providerId,
    departmentId,
    //reasonId,
    date
}: CreateSlotParams): Promise<AppointmentSlot> => {
    const appointmentdate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date
        .getDate()
        .toString().padStart(2, '0')}/${date.getFullYear()}`;
    // Format time as hh:mm (24-hour)
    const appointmenttime = `${date.getHours().toString().padStart(2, '0')}:${date
        .getMinutes()
        .toString().padStart(2, '0')}`;

    const payload = querystring.stringify({
        'reasonid': 1281,
        'providerid': providerId,
        'departmentid': departmentId,
        // parse to mm/dd/yyyy
        'appointmentdate': appointmentdate,
        // parse to hh:mm (24-hour clock)
        'appointmenttime': appointmenttime,
        'appointmenttypeid': 1281,
    })

    console.log({payload})

    const {data} = await axios.post(`/v1/${practiceId}/appointments/open`, payload)

    // { appointmentids: { '1387803': '02:29' } }
    return {
        id: parseInt(Object.keys(data.appointmentids)[0]),
        time: data.appointmentids[Object.keys(data.appointmentids)[0]]
    }
}

export default createSlot