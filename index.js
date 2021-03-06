require('dotenv-safe').config({
  allowEmptyValues: true
});
var jwt = require('jsonwebtoken');

var http = require('http');
const express = require('express')
//const httpProxy = require('express-http-proxy')
const app = express()
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const helmet = require('helmet');

const mysql = require('mysql');

app.use(logger('dev'));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/', (req, res, next) => {
  console.log('Api funcionando...');
})

//authentication
app.post('/login', (req, res, next) => {

    if (req.body.pwd === process.env.YT_SECRET){
      
        //auth ok
        const id = 1; //esse id viria do banco de dados
        var token = jwt.sign({ id }, process.env.SECRET, {
        expiresIn: 300 // expires in 5min
        });
        res.status(200).send({ auth: true, token: token });
    }
    else {
      res.status(500).send('Login inválido!');
    }
})

function verifyJWT(req, res, next){
  var token = req.headers['x-access-token'];
  if (!token) 
    return res.status(401).send({ auth: false, message: 'No token provided.' });
  else {
      jwt.verify(token, process.env.SECRET, function(err, decoded) {
        if (err) 
        return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        
        // se tudo estiver ok, salva no request para uso posterior
        req.userId = decoded.id;
        next();
      });
    }
  }

  
function execSQLQuery(sqlQry, res){
  const connection = mysql.createConnection({
    host     : process.env.BDHOST,
    port     : process.env.BDPORT,
    user     : process.env.BDUSER,
    password : process.env.BDPWD,
    database : process.env.BDNAME
  });

  connection.query(sqlQry, function(error, results, fields){
      if(error) 
        res.json(error);
      else
        res.json(results);
      connection.end();
  });
}

const campos = 'titulo, id, cia, nomehotel1, cidade_saida, pais, regiao, valores_apartir, ' + 
  'cidade_destino, datasaida_str, datachegada_str, empresa_nomefantasia, cidadedestinoid';

app.get('/roteiros', verifyJWT, (req, res, next) => {
  execSQLQuery('SELECT ' + campos + ' FROM roteiros group by titulo', res);
})

app.get('/roteiros/:id?', verifyJWT, (req, res) =>{
  let filter = '';
  if(req.params.id) filter = ' WHERE ID=' + parseInt(req.params.id);
  execSQLQuery('SELECT ' + campos + ' FROM roteiros' + filter, res);
})

// Proxy request
var server = http.createServer(app);
var port = process.env.PORT || 3000;
//console.log('API funcionando...')
server.listen(port);