const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const http = require('http');
const mysql = require('mysql');
const con = mysql.createConnection({
  host: "triggerscore-aws.cyo3r8nlmim9.us-east-1.rds.amazonaws.com",
  database: "triggerscore",
  user: "admin",
  password: "CbVMaet4pqrMZ7dST2Ib",
  port: 3306
});

const sql = `SELECT * FROM triggerscore ORDER BY id ASC`;

con.connect(function(err) {
  if(err) throw err;
  console.log("Connected!");
  con.query(sql, function (err, result) {
     if (err) throw err;
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

app.get('/movie/:id', function(req,res) {
  con.query(`SELECT * FROM triggerscore WHERE movie_id = ${req.params.id}`, function(err,result){
    if(err) throw err;
    else {
      let calculatedScore = calculateScores(result)
      res.send(calculatedScore)
    }
  })
})

app.get('/recentratings', function(req,res) {
  con.query(`SELECT * FROM triggerscore ORDER BY id DESC LIMIT 6`, function(err,result){
    if(err) throw err;
    else {
      res.send(result)
    }
  })
})

app.get('/top10-sexism', function(req,res){
  con.query(sql, function(err,result){
    if (err) throw err;
    else {
      let calculatedScores = calculateScores(result)
      let top10 = calculatedScores.sort((a,b)=> {return b.rating_sexism - a.rating_sexism})
      res.send(top10.slice(0,10));
    }})
})

app.get('/top10-racism', function(req,res){
  con.query(sql, function(err,result){
    if (err) throw err;
    else {
      let calculatedScores = calculateScores(result)
      let top10 = calculatedScores.sort((a,b)=> {return b.rating_racism - a.rating_racism})
      res.send(top10.slice(0,10));
    }})
})

app.get('/top10-others', function(req,res){
  con.query(sql, function(err,result){
    if (err) throw err;
    else {
      let calculatedScores = calculateScores(result)
      let top10 = calculatedScores.sort((a,b)=> {return b.rating_others - a.rating_others})
      res.send(top10.slice(0,10));
    }})
})

app.get('/top10-cringe', function(req,res){
  con.query(sql, function(err,result){
    if (err) throw err;
    else {
      let calculatedScores = calculateScores(result)
      let top10 = calculatedScores.sort((a,b)=> {return b.rating_cringe - a.rating_cringe})
      res.send(top10.slice(0,10));
    }})
})

app.get('/stats', function(req,res){
  con.query(sql, function(err,result){
  if (err) throw err;
    else {
      let calculatedScores = calculateScores(result)
      let amountComments =  countComments(result)
      console.log(amountComments)
      let totalRatings = result.length
      let totalMovies = calculatedScores.length
      let allScoresTotal = 0
      let allScoresSexism = 0
      let allScoresRacism = 0
      let allScoresOthers = 0
      let allScoresCringe = 0
      calculatedScores.forEach(score=>{allScoresTotal = allScoresTotal + score.rating_total})
      calculatedScores.forEach(score=>{allScoresSexism = allScoresSexism + score.rating_sexism})
      calculatedScores.forEach(score=>{allScoresRacism = allScoresRacism + score.rating_racism})
      calculatedScores.forEach(score=>{allScoresOthers = allScoresOthers + score.rating_others})
      calculatedScores.forEach(score=>{allScoresCringe = allScoresCringe + score.rating_cringe})
      let averageScoreTotal = Math.floor(allScoresTotal / totalMovies * 10) / 10
      let averageScoreSexism = Math.floor(allScoresSexism/ totalMovies * 10) / 10
      let averageScoreRacism = Math.floor(allScoresRacism / totalMovies * 10) / 10
      let averageScoreOthers = Math.floor(allScoresOthers / totalMovies * 10) / 10
      let averageScoreCringe = Math.floor(allScoresCringe / totalMovies * 10) / 10
      let stats = {
                    "totalRatings":totalRatings,
                    "averageScoreTotal":averageScoreTotal,
                    "averageScoreSexism":averageScoreSexism,
                    "averageScoreRacism":averageScoreRacism,
                    "averageScoreOthers":averageScoreOthers,
                    "averageScoreCringe":averageScoreCringe,
                    "amountMovies":totalMovies,
                    "amountComments": amountComments
                  }
      res.send(stats);
    }})
})


function calculateScores(data){
  let scores = []
  let comments = 0
  data.forEach(entry => {
    if(entry.comment != null && entry.comment.length > 3){
      comments += 1
    }
    let index = scores.map(score => score.movie_id).indexOf(entry.movie_id)
    let entryTotal = (entry.rating_sexism + entry.rating_racism + entry.rating_others) / 3
    if(index == -1) {
      entry.rating_total = entryTotal
      entry.ratings = 1
      entry.comments = [entry.comment]
      scores.push(entry)
    } else {
      scores[index].ratings += 1
      scores[index].rating_sexism += entry.rating_sexism
      scores[index].rating_racism += entry.rating_racism
      scores[index].rating_others += entry.rating_others
      scores[index].rating_cringe += entry.rating_cringe
      scores[index].rating_total += entryTotal
      scores[index].comments.push(entry.comment)
    }
  })
  scores.forEach(score=> {
    score.rating_sexism = Math.floor(score.rating_sexism / score.ratings * 10) / 10
    score.rating_racism = Math.floor(score.rating_racism / score.ratings * 10) / 10
    score.rating_others = Math.floor(score.rating_others / score.ratings * 10) / 10
    score.rating_cringe = Math.floor(score.rating_cringe / score.ratings * 10) / 10
    score.rating_total = Math.floor(score.rating_total / score.ratings * 10) / 10
    score.comments = score.comments.filter(entry => {return entry != null})
  })
  return  scores
}

function countComments(data){
  let comments = 0
  data.forEach(entry => {
      if(entry.comment != null && entry.comment.length > 3){
        comments += 1
      }
  })
  return comments
}



app.post('/post', function(request,response){
  //const postSQL = 'INSERT INTO highscores (Player, Score) VALUES ([request.body.Player],[request.body.Score])';
  console.log(request.body);
  if(request.body.movieID == undefined) {
    console.log("no movie defined in request body.............")
  }
  if(request.body.movieID != undefined){
    con.query('INSERT INTO triggerscore (movie_id,rating_sexism, rating_racism, rating_others, rating_cringe, comment, like, dislike) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',[request.body.movieID,request.body.sexism,request.body.racism, request.body.others, request.body.cringe, request.body.comment, request.body.like, request.body.dislike], function (err) {
      if(err) throw err;
      else {response.send("Received request")};
  })
  }
})