const express = require('express');
const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'basicsite'
});

db.connect((err) => {
    if(err){
        throw err;
    }
    console.log('MySQL connected...');
});

module.exports = db;