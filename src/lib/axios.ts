import Axios from 'axios'
import getAccessToken from "@/api/auth/getAccessToken";

const CLIENT_ID = '0oavy5jv043ak62Py297'
const CLIENT_SECRET = 'gQ5dpgcplwg7_sfwE2T0GHTaI1ZU2_tzy6gF1DiAOop5tDCkb-pRnHXVwsxOWlXX'

const axios = Axios.create({
    baseURL: 'https://api.preview.platform.athenahealth.com',
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
    },
})

axios.interceptors.request.use(async (config) => {
    if (config.url && config.url.includes('/oauth2/v1/token')) {
        return config;
    }

    const accessToken = await getAccessToken(CLIENT_ID, CLIENT_SECRET);
    console.log({accessToken})
    config.headers['Authorization'] = `Bearer ${accessToken.access_token}`;
    return config;
})

export default axios
