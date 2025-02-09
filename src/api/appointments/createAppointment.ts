import * as querystring from "node:querystring";
import axios from "../../lib/axios";

interface CreateAppointmentParams {
    patientId: number
    slotId: number
}

const createAppointment = async (practiceId: number, {patientId, slotId}: CreateAppointmentParams) => {
    const payload = querystring.stringify({
        'reasonid': 1281,
        'patientid': patientId,
    })

    const { data } = await axios.put(`/v1/${practiceId}/appointments/${slotId}`, payload)

    return data
}

export default createAppointment