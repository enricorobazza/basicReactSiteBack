const express = require('express');
const cors = require('cors');
const db = require('./database');
const multer = require('multer');
const FTPStorage = require('multer-ftp');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

var AuthController = require('./AuthController');

function getRandomInt(min, max){
    return Math.floor(Math.random() * (max - min) + min);
}

// const upload = multer({
//     storage: new SFTPStorage({
//         sftp: {
//             host: process.env.FTP_HOST,
//             port: 22,
//             user: process.env.FTP_USER,
//             password: process.env.FTP_PASSWORD
//         },
//         destination: function(req, file, callback){
//             callback(null, '/public_html/react/public/uploads/')
//         },
//         filename: function(req, file, callback){
//             callback(null, file.fieldname + getRandomInt(1,1000) + '-' + Date.now() + path.extname(file.originalname))
//         }
//     })
// })

const upload = multer({
    storage: new FTPStorage({
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
    })
})

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
    console.log('passou!!');
    res.send('All set!!!!');
});

function groupImages(json){
    var dict = {};
    var newJson = [];
    json.forEach((element, index) => {
        if(!dict[element.id]){
            dict[element.id] = index;
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
    // db.query("select s.*, JSON_ARRAYAGG(si.url) as images from sections s left join section_images si on(s.id = si.section_id) where branch = ? group by s.id;",[req.params.op],function(err, sections, fields){
    //     if (err) throw err;
    //     res.status(200).json(sections);
    // });
    db.query("select s.*, si.url as image from sections s left join section_images si on(s.id = si.section_id) where branch = ?;",[req.params.op],function(err, sections, fields){
        if (err) throw err;
        res.status(200).json(groupImages(sections));
    });
});

app.get('/sections/:op/:id', (req, res) => {
    db.query("select * from sections where id = ? and branch = ?", [req.params.id, req.params.op], (err, result) => {
        if(err) throw err;
        if(result.length > 0) res.status(200).json(result[0]);
        else res.status(404).send("Section not found!");
    });
})

app.post('/sections/:op/:id', upload.array('images'), (req, res) => {
    db.query("select * from section_images where section_id = ?", [req.params.id], (err, result) => {
        if(err){    
            res.send("Erro ao pesquisar imagens!");
            throw err;
        }
        // for(var i=0; i<result.length; i++)
        // {
        //     image = result[i];
        //     var fullPath = image.url.split("/");
        //     var imgPath = "./public/uploads/" + fullPath[fullPath.length-1];
        //     fs.unlink(imgPath, (err) => {
        //         if(err)
        //         {
        //             console.error(err);
        //             return;
        //         }
        //         // console.log(imgPath + " deletado!");
        //     })
        // }

        db.query("delete from section_images where section_id = ?", [req.params.id], (err, result) => {
            if(err){
                res.send("Erro ao deletar");
                throw err;
            }
                
            db.query("update sections set text = ? where id = ?", [req.body.text, req.params.id], (err, result) => {
                if(err){
                    res.send("Erro ao atualizar");
                    throw err;
                }
                
                images = req.files;
                images.forEach(image => {
                    var url = process.env.BASE_FRONT_URL+"/public/uploads/"+image.path.split('/').pop();
                    db.query("insert into section_images values(?,?)", [req.params.id, url], function(err, result){
                        if(err) {
                            console.log("Erro ao inserir imagem na seção!");
                            throw err;
                        }
                    })
                });
                res.send("Atualizado com sucesso!");
                
            })
                
        })

    })
})

app.post('/sections/:op', upload.array('images') ,(req, res) => {
    db.query("insert into sections values(0, ?, ?, ?, ?)", [req.body.title, req.body.text, '', req.params.op], (err, result) => {
        if(err){ 
            res.send("Erro ao inserir!");
            throw err;
        }
        else{
            images = req.files;
            images.forEach(image => {
                var url = process.env.BASE_FRONT_URL + "/public/uploads/"+image.path.split("/").pop();
                db.query("insert into section_images values(?,?)", [result.insertId, url], function(err, result){
                    if(err) throw err;
                })
            })
            // console.log(result.insertId);
            res.send("Inserido com sucesso!");
        }
    });
})

app.listen(process.env.PORT || 3000);

