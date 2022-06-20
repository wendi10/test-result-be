const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const connection = require('./database');

const app = express();

app.use(express.json())
app.use(cors({
    origin: 'http://localhost:4200'
}))

app.post('/login', (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    connection.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], function(err, rows, fields) {
        if(err){
            console.log(err);
            return;
        }
         
        // if user not found
        if (rows.length <= 0) {
            res.status(401)
            res.json({
                error: 'Please enter correct Username and Password!'
            });
        }
        else {
            const {id, username, created_at} = rows[0]
            const user = {
                id,
                username,
                created_at,
            };
            jwt.sign(user, 'secret', (err, token) => {
                if(err) {
                    res.sendStatus(304);
                    return;
                }

                res.json({
                    user: user,
                    token
                })
            })
        }            
    })
})

app.get('/customers', verifyUser, (req, res) => {
    connection.query(`SELECT * FROM customers, (SELECT count(*) AS total_data FROM customers) AS c ${setFilterCustomers(req.query)}`, (err ,rows) => {
    const totalData = rows[0]?.total_data;

    if(err){
        console.log(err);
        return;
    }
    
    if (rows.length <= 0) {
        res.status(200)
        res.json({
            data: null
        });
        return;
    }

    res.status(200);
    res.json({
        data: rows,
        pagination: {
            total_data: totalData,
            total_page: Math.ceil(totalData / req.query.limit),
        }
    })
 })
});

app.get('/customers/detail', verifyUser, (req, res) => {
    connection.query(`SELECT * FROM customers where id = ${req.query.id}`, (err, rows) => {
        if(err){
            console.log(err);
            return;
        }
         
        if (rows.length <= 0) {
            res.status(200)
            res.json({
                data: 'null'
            });
            return;
        }
    
        res.status(200);
        res.json({
            data: rows[0],
        })
    })
})

app.post('/customers', (req, res) => {
    const {username, first_name, last_name, email, birth_date, basic_salary, status, group, description} = req.body

    connection.query(`INSERT INTO customers (username, first_name, last_name, email, birth_date, basic_salary, status, customers.group, description) VALUES ('${username}', '${first_name}', '${last_name}', '${email}', '${birth_date}', ${basic_salary}, '${status}', '${group}', '${description}')`, (err, rows) => {
        if(err){
            console.log(err);
            return;
        }
    
        res.status(200);
        res.json({
            message: 'Success Create New Customer',
        })
    })
})

function verifyUser(req, res, next) {
    const auth= req.headers.authorization;
    jwt.verify(auth, 'secret', (err, data) => {
        if(err){
            res.status(401)
            res.json(err)
        }
        req.body = data
        next()
    })
}

function getOffset(currentPage = 1, listPerPage) {
    return (currentPage - 1) * [listPerPage];
}

function setFilterCustomers(filter) {
    const {search, status, orderBy, page, limit } = filter
    let filterUsername= ''
    let filterStatus= ''
    let filterStatusAndUsername= ''
    let filterOrder= ''
    let filterPagination= ''

    if(search && !status){
        filterUsername = `WHERE username LIKE '%${search}%' `
    };

    if(status && !search){
        filterStatus = `WHERE status LIKE '${status}' `
    };

    if(status && search){
        filterStatusAndUsername = `WHERE username LIKE '%${search}%' AND status LIKE '${status}' `
    };

    if(orderBy){
        filterOrder = `ORDER BY id ${orderBy} `
    }

    if(page && limit){
        filterPagination = `LIMIT ${getOffset(page, limit)},${limit}`
    }

    return (status && search ? filterStatusAndUsername : search && !status ? filterUsername : filterStatus) + filterOrder + filterPagination
}

app.listen(3000, () => {
    console.log('App listening on port 3000');
    connection.connect((err) => {
        if(err){ 
            console.log(err);
            return;
        }

        console.log("Database connected!");
    })
});