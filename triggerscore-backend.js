const express = require('express')
const { MongoClient } = require("mongodb")
const cors = require('cors')

require('dotenv').config()

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.listen(port, '0.0.0.0', () => {
    console.log(`Server Started at ${port}`)
})

let database
const uri = `mongodb+srv://ceckardt254:${process.env.DATABASE_PASSWORD}@cluster0.sen83.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })

const run = async () => {
  try {
    database = client.db('triggerscore')
    const scores = database.collection('scores')
    const query = { "id": "3" }
  }
  catch {
    throw error
  }
}

run().catch(console.dir)

function calculateScores(data){
  let scores = []
  let comments = 0
  let likes = 0
  let dislikes = 0
  data.forEach(entry => {
    if(entry.comment != null && entry.comment.length > 3){
      comments += 1
    }
    const index = scores.map(score => score.movie_id).indexOf(entry.movie_id)
    const entryTotal = calculateTotal(entry)
    if(index == -1) {
      entry.rating_total = entryTotal
      entry.ratings = 1
      entry.comments = [entry.comment]
      entry.likes = 0
      entry.dislikes = 0
      if(entry.liked == 1){
        entry.likes += 1
      }
      if(entry.disliked == 1){
        entry.dislikes += 1
      }
      scores.push(entry)
    } else {
      scores[index].ratings += 1
      scores[index].rating_sexism += entry.rating_sexism
      scores[index].rating_racism += entry.rating_racism
      scores[index].rating_others += entry.rating_others
      scores[index].rating_cringe += entry.rating_cringe
      scores[index].rating_total += entryTotal
      if(entry.liked == 1){
        scores[index].likes += 1
      }
      if(entry.disliked == 1){
          scores[index].dislikes += 1
      }
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

function calculateTotal(score){
  const racism = score.rating_racism
  const sexism = score.rating_sexism
  const others = score.rating_others
  const highest = Math.max(racism,sexism,others)
  return (racism + sexism + others + highest*5) / 8  
}

function countLikesAndDislikes(data){
  let likes = {
    likes: 0,
    dislikes: 0
  }
  data.forEach(entry => {
      if(entry.liked == 1){
        likes.likes += 1
      }
      if(entry.disliked == 1){
        likes.dislikes += 1
      }
  })
  return likes
}
app.get('/', async (req, res) => {
  try {
    const scores = await database.collection('scores').find().toArray()
    res.json(scores)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

app.get('/movie/:id', async (req,res) => {
  try {
    const ratings = await database.collection('scores').find({ "movie_id": req.params.id }).toArray()
    res.json(calculateScores(ratings))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

app.get('/recentratings', async (req,res) => {
  try {
    const ratings = await database.collection('scores').find().sort( { id: -1 }).limit(6).toArray()
    res.json(ratings)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

app.get('/recentcomments', async (req,res) => {
  try {
    const ratings = await database.collection('scores')
    .find(
      { 
        comment: { $ne: null, $ne: "" } 
      }
    ).sort(
      { id: -1 }
    ).limit(8)
    .toArray()
    res.json(ratings)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

app.get('/top10-sexism', async (req,res) => {
    try {
      const ratings = await database.collection('scores')
      .find()
      .sort({ rating_sexism: -1 })
      .limit(10)
      .toArray()
      res.json(ratings)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
})

app.get('/top10-racism', async (req,res) => {
    try {
      const ratings = await database.collection('scores')
      .find()
      .sort({ rating_racism: -1 })
      .limit(10)
      .toArray()
      res.json(ratings)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
})

app.get('/top10-others', async (req,res) => {
  try {
    const ratings = await database.collection('scores')
      .find()
      .sort({ rating_others: -1 })
      .limit(10)
      .toArray()
      res.json(ratings)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

app.get('/top10-cringe', async (req,res) => {
  try {
    const ratings = await database.collection('scores')
      .find()
      .sort({ rating_cringe: -1 })
      .limit(10)
      .toArray()
      res.json(ratings)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

app.get('/stats', async (req,res) => {
  try {
    const ratings = await database.collection('scores')
      .find()
      .sort({ rating_cringe: -1 })
      .limit(10)
      .toArray()
      const calculatedScores = calculateScores(ratings)
      const amountComments =  countComments(ratings)
      const amountLikes = countLikesAndDislikes(ratings)
      const totalRatings = ratings.length
      const totalMovies = calculatedScores.length
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
      const averageScoreTotal = Math.floor(allScoresTotal / totalMovies * 10) / 10
      const averageScoreSexism = Math.floor(allScoresSexism/ totalMovies * 10) / 10
      const averageScoreRacism = Math.floor(allScoresRacism / totalMovies * 10) / 10
      const averageScoreOthers = Math.floor(allScoresOthers / totalMovies * 10) / 10
      const averageScoreCringe = Math.floor(allScoresCringe / totalMovies * 10) / 10
      const stats = {
                    "totalRatings":totalRatings,
                    "averageScoreTotal":averageScoreTotal,
                    "averageScoreSexism":averageScoreSexism,
                    "averageScoreRacism":averageScoreRacism,
                    "averageScoreOthers":averageScoreOthers,
                    "averageScoreCringe":averageScoreCringe,
                    "amountMovies":totalMovies,
                    "amountComments": amountComments,
                    "amountLikes": amountLikes.likes,
                    "amountDislikes": amountLikes.dislikes
                  }
      res.send(stats)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

app.post('/post', async (request,response) => {
  if (request.body.movieID === undefined) {
    console.log("No movie defined in request body...")
    response.status(400).send("Movie ID is required")
    return
  }

  try {
    const result = await database.collection('triggerscore').insertOne({
      movie_id: request.body.movieID,
      rating_sexism: request.body.sexism,
      rating_racism: request.body.racism,
      rating_others: request.body.others,
      rating_cringe: request.body.cringe,
      comment: request.body.comment,
      liked: request.body.like,
      disliked: request.body.dislike
    })
    response.send("Received request")
  } catch (err) {
    console.error(err);
    response.status(500).send("Error inserting data")
  }
})