var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

const db = require('./database');

var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var config = require('../config');

router.post('/register', function(req, res){
    var hashedPassword = bcrypt.hashSync(req.body.password, 8);

    db.query("insert into users values(0,?,?);", [req.body.login, hashedPassword], (err, result) => {
        if(err){ 
            res.status(500).send("Erro ao inserir!");
            throw err;
        }
        else{
            var token = jwt.sign({ id: result.insertId }, config.secret, {
                expiresIn: 86400 // expires in 24 hours
            });
            res.status(200).send({ auth: true, token: token });
        }
    });
});

router.post('/login', function(req, res){

    db.query("select * from users where login = ?", [req.body.login], (err, result) => {
        if(err){
            res.status(500).send("Erro ao logar!");
            throw err;
        }
        else{
            if(result.length == 0){
                return res.status(400).send({error: 'User not found'});
            }

            if(bcrypt.compareSync(req.body.password, result[0].password)){   
                var token = jwt.sign({ id: result.id }, config.secret, {
                    expiresIn: 86400 // expires in 24 hours
                });
                console.log("logado");
                res.status(200).send("logado");
            }
            else{
                console.log("Usuário ou senha inválidos!");
                res.status(400).send({error: "Invalid password"});
            }
        }
    });
});

router.get('/me', function(req, res) {
    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
    
    jwt.verify(token, config.secret, function(err, decoded) {
      if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
      
      res.status(200).send(decoded);
    });
  });

module.exports = router;

