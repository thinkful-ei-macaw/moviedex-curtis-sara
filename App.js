require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const app = express();
const PORT = process.env.PORT || 8000
const data = require('./movies-data-small.json');
const morganSetting = 
  process.env.NODE_ENV === 'production' ? 'tiny' : 'common'

app.use(morgan(morganSetting))
app.use(validateAuthorization);
app.use(helmet());
app.use(cors());

app.use((error, req, res, next) => {
  let response
  if (process.env.NODE_ENV === 'production') {
    response = { error: { message: 'server error' }}
  } else {
    response = { error }
  }
  res.status(500).json(response)
})

function validateAuthorization(req, res, next) {
  const API_TOKEN = process.env.API_TOKEN;
  const authValue = req.get('Authorization');

  if (authValue === undefined) {
    return res.status(400).json({ error: 'Authorization header missing' });
  }

  if (!authValue.toLowerCase().startsWith('bearer ')) {
    return res.status(400).json({ error: 'Invalid Authorization method: Must use Bearer strategy' });
  }

  const token = authValue.split(' ')[1];

  if (token !== API_TOKEN) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  next();
}

function handleTypes(req, res) {
  let { genre, country, avg_vote } = req.query;
  let results = data;

  genre = genre && genre.toLowerCase();
  country = country && country.toLowerCase();
  avg_vote = avg_vote && parseInt(avg_vote);

  if(!genre && !country && !avg_vote) {
    return res  
      .send(results);
  }

  if(genre) {
    results = results.filter(movie => movie.genre.toLowerCase().includes(genre));
  }

  if(country){
    results = results.filter(movie => movie.country.toLowerCase().includes(country));
  }

  if(avg_vote) {
    results = results.filter(movie => parseInt(movie.avg_vote) >= avg_vote);
  }
  
  return res.json(results);
}


app.get( '/movie', validateAuthorization, handleTypes);


module.exports = app