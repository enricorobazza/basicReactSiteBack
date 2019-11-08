const express = require('express');
const cors = require('cors');
const dbExecute = require('./database');
const multer = require('multer');
const FTPStorage = require('multer-ftp');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer')

var AuthController = require('./AuthController');

function getRandomInt(min, max){
    return Math.floor(Math.random() * (max - min) + min);
}

const storage = new FTPStorage({
    basepath: '/public_html/react/public/uploads',
    ftp: {
        host: process.env.FTP_HOST,
        secure: false,
        user: process.env.FTP_USER,
        password: process.env.FTP_PASSWORD
    },
    destination: function(req, file, options, callback){
        var base_url = "/public_html/react/public/uploads/";
        callback(null, base_url + file.fieldname + getRandomInt(1,1000) + '-' + Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage });

// const storage = multer.diskStorage({
//     destination: 'public/uploads/',
//     filename: function(req, file, callback){
//         callback(null, file.fieldname + getRandomInt(1,1000) + '-' + Date.now() + path.extname(file.originalname))
//     }
// });

// const upload = multer({
//     storage: storage
// });

const app = express();

// app.use(cors({origin: "http://cucomaluko.com.br"}))
app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static('public'));
app.use('/auth', AuthController);

app.get('/', (req, res) => {
    res.status(200).send({});
});

function groupImages(json){
    var dict = {};
    var newJson = [];
    json.forEach((element, index) => {
        if(dict[element.id] == undefined){
            dict[element.id] = newJson.length;
            var images = element.image ? [element.image] : [];
            newJson.push({
                id: element.id,
                title: element.title, 
                text: element.text, 
                branch: element.branch, 
                images
            });
        }
        else newJson[dict[element.id]].images.push(element.image);
    });
    return newJson;
}

app.get('/sections/:op', (req, res) => {
    dbExecute(db=>{return new Promise((resolve, reject)=>{
        db.query("select s.*, si.url as image from sections s left join section_images si on(s.id = si.section_id) where branch = ?;",[req.params.op],function(err, sections, fields){
            resolve();
            if (err) res.status(400).send({error: "Failed to find sections.", description: err});
            else res.status(200).json(groupImages(sections));
        });
    })})
});

app.get('/sections/:op/:id', (req, res) => {
    dbExecute(db=>{return new Promise((resolve, reject)=>{
        db.query("select * from sections where id = ? and branch = ?", [req.params.id, req.params.op], (err, result) => {
            resolve();
            if(err) res.status(400).send({error: "Failed to search section.", description: err});
            if(result.length > 0) res.status(200).json(result[0]);
            else res.status(404).send({error: "Section not found."});
        });
    })});
})

app.put('/sections/:op/:id', upload.array('images'), (req, res) =>{
    dbExecute(db=>{return new Promise((resolve, reject)=>{
        db.query(
            "select * from section_images where section_id = ?;" + 
            "delete from section_images where section_id = ?;"+
            "update sections set text = ? where id = ?;", [req.params.id, req.params.id, req.body.text, req.params.id],
            (err, results) =>{
                if(err){
                    resolve();
                    res.send({error: "Failed to update section.", description: err});
                }
                for(var i=0; i<results[0].length; i++){
                    image = results[0][i];
                    var path = "/public_html/react/public/uploads/" + image.url.split("/").pop();
                    var file = {path};
                    storage._removeFile(req, file, (err) => {
                        if(err) console.log(err)
                    })
                }
                images = req.files;
                images.forEach(image => {
                    var url = process.env.BASE_FRONT_URL+"/public/uploads/"+image.path.split('/').pop();
                    db.query("insert into section_images values(?,?)", [req.params.id, url], function(err, result){
                        resolve();
                        if(err) {
                            res.status(400).send({error: "Failed to insert section image.", description: err});
                            return;
                        }
                    })
                });
                if(!images.length){ 
                    resolve();
                }
                res.status(200).send({id:req.params.id});
            })
    })});
});

app.post('/email', (req, res) => {
    var remetente = nodemailer.createTransport({
        host: 'mail.cucomaluko.com.br',
        service: 'SMTP',
        port: 465,
        secure: true,
        auth:{
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    var emailToSend = {
        from: 'contato@cuckomalulo.com.br',
        to: 'enricorobazzi@gmail.com',
        subject: 'Email enviado com sucesso',
        text: 'Email enviado'
    }

    remetente.sendMail(emailToSend, (err)=>{
        if(err) {
            console.log(err)
            res.status(404).send(err);
        }
        res.send({ok: "ok"})
    })
})

app.post('/sections/:op', upload.array('images') ,(req, res) => {
    dbExecute(db=> {return new Promise((resolve, reject) =>
    {
        db.query("insert into sections values(0, ?, ?, ?, ?)", [req.body.title, req.body.text, '', req.params.op], (err, result) => {
            if(err){ 
                resolve();
                res.status(400).send({error:"Section insertion failed.", description: err});
                return;
            }
            else{
                images = req.files;
                images.forEach(image => {
                    var url = process.env.BASE_FRONT_URL + "/public/uploads/"+image.path.split("/").pop();
                    db.query("insert into section_images values(?,?)", [result.insertId, url], function(err, result){
                        if(err){ 
                            resolve();
                            res.status(400).send({error:"Section images insertion failed.", description: err});
                            return;
                        }
                    })
                })
                resolve();
                res.status(201).send({id: result.insertId});
            }
        });
    })});
})

app.listen(process.env.PORT || 3000);

