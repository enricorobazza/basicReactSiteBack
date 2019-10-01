const express = require('express');
const mysql = require('mysql');
const config = require('../../config')

// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'basicsite'
// });

const {host, user, password, database} = config;
host = process.env.HOST || host;
user = process.env.USER || user;
password = process.env.PASSWORD || password;
database = process.env.DATABASE || database;

const db = mysql.createConnection({ host, user, password, database });

db.connect((err) => {
    if(err){
        throw err;
    }
    console.log('MySQL connected...');
});

module.exports = db;