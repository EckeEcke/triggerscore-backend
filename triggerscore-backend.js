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

app.get('/movie', function(req,res) {
  con.query(`SELECT * FROM triggerscore WHERE movie_id = ${req.query.id}`, function(err,result){
    if(err) throw err;
    else {
      let calculatedScore = calculateScores(result)
      res.send(calculatedScore)
    }
  })
})


function calculateScores(data){
  let scores = []
  console.log(data)
  data.forEach(entry => {
    let index = scores.map(score => score.movie_id).indexOf(entry.movie_id)
    let entryTotal = (entry.rating_sexism + entry.rating_racism + entry.rating_others) / 3
    if(index == -1) {
      entry.rating_total = entryTotal
      entry.ratings = 1
      scores.push(entry)
    } else {
      scores[index].ratings += 1
      scores[index].rating_sexism += entry.rating_sexism
      scores[index].rating_racism += entry.rating_racism
      scores[index].rating_others += entry.rating_others
      scores[index].rating_cringe += entry.rating_cringe
      scores[index].rating_total += entryTotal
    }
  })
  scores.forEach(score=> {
    score.rating_sexism = Math.floor(score.rating_sexism / score.ratings * 10) / 10
    score.rating_racism = Math.floor(score.rating_racism / score.ratings * 10) / 10
    score.rating_others = Math.floor(score.rating_others / score.ratings * 10) / 10
    score.rating_cringe = Math.floor(score.rating_cringe / score.ratings * 10) / 10
    score.rating_total = Math.floor(score.rating_total / score.ratings * 10) / 10
  })
  return  scores
}



app.post('/post', function(request,response){
  //const postSQL = 'INSERT INTO highscores (Player, Score) VALUES ([request.body.Player],[request.body.Score])';
  console.log(request.body);
  if(request.body.movieID == undefined) {
    console.log("no movie defined in request body.............")
  }
  if(request.body.movieID != undefined){
    con.query('INSERT INTO triggerscore (movie_id,rating_sexism, rating_racism, rating_others, rating_cringe) VALUES (?, ?, ?, ?, ?)',[request.body.movieID,request.body.sexism,request.body.racism, request.body.others, request.body.cringe], function (err) {
      if(err) throw err;
      else {response.send("Received request")};
  })
  }
})