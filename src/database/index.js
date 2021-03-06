const mysql = require('mysql');
// const config = require('../../config')

// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'basicsite'
// });

// const {host, user, password, database} = config;
// host = process.env.HOST || host;
// user = process.env.USER || user;
// password = process.env.PASSWORD || password;
// database = process.env.DATABASE || database;

host = process.env.HOST;
user = process.env.USER;
password = process.env.PASSWORD;
database = process.env.DATABASE;

function dbExecute(cb){
    let db = mysql.createConnection({ host, user, password, database, multipleStatements: true });
    db.connect(err=>{
        if(err){
            throw err;
        }
        console.log("MySQL connected...");
        cb(db).then(()=>{
            db.end(err =>{
                if(err) throw err;
                console.log("MySQL disconnected...");
            });
        })
        
    })
}

// const db = mysql.createConnection({ host, user, password, database });

// db.connect((err) => {
//     if(err){
//         throw err;
//     }
//     console.log('MySQL is connected...');
// });

// module.exports = db;
module.exports = dbExecute;