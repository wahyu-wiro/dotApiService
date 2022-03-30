const pg = require('pg');

const connection = `postgres://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOSTNAME}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;
const pgCon = new pg.Client(connection);
pgCon.connect(function (err, client) {
    if (!err) {
        console.log('Connected PG');
    } else {
        console.log("Error connect PG : ", err);
    }
});

module.exports = pgCon;