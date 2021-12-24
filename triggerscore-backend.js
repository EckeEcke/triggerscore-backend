const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const http = require('http');
const mysql = require('mysql');
const con = mysql.createConnection({
  host: "ulsq0qqx999wqz84.chr7pe7iynqr.eu-west-1.rds.amazonaws.com",
  database: "qzl4o8akbn6y17dv",
  user: "mpwyg8k3gepwa8ib",
  password: "cgyqdt5o7p6l3q6w",
  port: 3306
});

const sql = `SELECT * FROM triggerscore ORDER BY id ASC`;


con.connect(function(err) {
  if(err) throw err;
  console.log("Connected!");
  con.query(sql, function (err, result) {
     if (err) throw err;
     console.log("Result: " + result);
  });
});

app.use(cors());
app.use(express.json());

app.get('/', function (req, res) {
  con.query(sql, function(err,result){
    if (err) throw err;
    else {
      res.send(result);
    }})
}).listen(port);






app.post('/post', function(request,response){
  //const postSQL = 'INSERT INTO highscores (Player, Score) VALUES ([request.body.Player],[request.body.Score])';
  console.log(request.body);
  if(request.body.movieID == undefined) {
    console.log("no player defined in request body.............")
  }
  if(request.body.movieID != undefined){
    con.query('INSERT INTO triggerscore (movieID,sexism, racism, others, cringe) VALUES (?, ?, ?, ?, ?)',[request.body.movieID,request.body.sexism,request.body.racism, request.body.others, request.body.cringe], function (err) {
      if(err) throw err;
      else {response.send("Received request")};
  })
  }
})