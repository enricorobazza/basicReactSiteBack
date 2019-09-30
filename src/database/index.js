const express = require('express');
const mysql = require('mysql');

// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'basicsite'
// });

const db = mysql.createConnection({
    host: 'localhost',
    user: '7834ad935479',
    password: '3522d90cf732d102',
    database: 'cucomalukodb'
});

db.connect((err) => {
    if(err){
        throw err;
    }
    console.log('MySQL connected...');
});

module.exports = db;