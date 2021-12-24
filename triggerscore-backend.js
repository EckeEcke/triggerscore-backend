const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const http = require('http');
const mysql = require('mysql');
const con = mysql.createConnection({
  host: "c8u4r7fp8i8qaniw.chr7pe7iynqr.eu-west-1.rds.amazonaws.com",
  database: "v0mtw65d57zsmu6p",
  user: "u7ghvmrp1qd4nd7e",
  password: "fdfmk7k5da0azwof",
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
      let calculatedScores = calculateScores(result)
      res.send(calculatedScores);
    }})
}).listen(port);

function calculateScores(data){
  let scores
  console.log(data)
  data.forEach(entry => {
    let index = scores.indexOf(entry)
    let entryTotal = entry.rating_sexism + entry.rating_racism + entry.rating_others + entry.rating_cringe
    if(index == -1) {
      entry.rating_total = entryTotal
      scores.push(entry)
    } else {
      scores[index].rating_sexism += entry.rating_sexism
      scores[index].rating_racism += entry.rating_racism
      scores[index].rating_others += entry.rating_others
      scores[index].rating_cringe += entry.rating_cringe
      scores[index].rating_total += entryTotal
    }
  })
  return scores
}




app.post('/post', function(request,response){
  //const postSQL = 'INSERT INTO highscores (Player, Score) VALUES ([request.body.Player],[request.body.Score])';
  console.log(request.body);
  if(request.body.movieID == undefined) {
    console.log("no player defined in request body.............")
  }
  if(request.body.movieID != undefined){
    con.query('INSERT INTO triggerscore (movie_id,rating_sexism, rating_racism, rating_others, rating_cringe) VALUES (?, ?, ?, ?, ?)',[request.body.movieID,request.body.sexism,request.body.racism, request.body.others, request.body.cringe], function (err) {
      if(err) throw err;
      else {response.send("Received request")};
  })
  }
})