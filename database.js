const mysql = require('mysql')

const connection = mysql.createConnection({
    host: 'localhost',
    database: 'practice_db',
    user: 'root',
    password: 'password',
})

module.exports = connection