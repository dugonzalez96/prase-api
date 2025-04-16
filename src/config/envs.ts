import 'dotenv/config';
import { get } from 'env-var';


export const envs = {
    PORT: get('PORT').required().asPortNumber(),
    TOKEN_SECRET_KEY: get('TOKEN_SECRET_KEY').required().asString(),
}