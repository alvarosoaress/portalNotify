import dotenv from 'dotenv'
import postgres from 'postgres';

dotenv.config()

const options = {
    types: {
        rect: {
            // The pg_types oid to pass to the db along with the serialized value.
            to: 1700,

            // An array of pg_types oids to handle when parsing values coming from the db.
            from: [1700],

            // Function that transforms values before sending them to the db.
            serialize: (val) => String(val),

            // Function that transforms values coming from the db.
            parse: (val) => {
                return parseFloat(val);
            },
        },
    },
}

const sql = postgres({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
}, options);

export default sql;
