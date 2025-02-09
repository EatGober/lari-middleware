import axios from "../../lib/axios";
import * as querystring from "node:querystring";

const getAccessToken = async (clientId: string, clientSecret: string, scope: string = 'athena/service/Athenanet.MDP.*') => {
    const {data} = await axios.post('/oauth2/v1/token', querystring.stringify({
        grant_type: 'client_credentials',
        scope: scope
    }), {
        auth: {
            username: clientId,
            password: clientSecret
        },
    })

    return data
}

export default getAccessToken