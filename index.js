const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require("mongoose");

const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI);

const userSchema = new mongoose.Schema({
  username: String
});

const User = mongoose.model("User", userSchema);

const exerciseSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true
  },
  description: String,
  duration: Number,
  date: Date
});

const Exercise = mongoose.model("Exercise", exerciseSchema);



app.use(cors())
app.use(express.static('public'))
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post("/api/users", async (req, res) =>
{
  const username = req.body.username;
  try
  {
    const newUser = new User({username});
    if(! await User.findOne({username: username}))
    {
      const userObj = await newUser.save();
      return res.json(userObj);
    }
    else
    {
      return res.send("User already found");
    }
    
  }catch(err)
  {
    console.log(err);
  }
  
});

app.get("/api/users", async (req, res) =>
{
  const Users = await User.find();
  return res.json(Users);
});

app.post("/api/users/:_id/exercises", async (req,res) =>
{
  const id = req.params._id;
  const {description, duration, date} = req.body;
  try
  {
    const user = await User.findById(id);
    if(!user)
    {
      res.send("User not found");
    }
    else
    {
      const exercise = new Exercise({
        user_id: id,
        description,
        duration,
        date: date ? new Date(date) : new Date()
      });

      const exerciseObj = await exercise.save();

      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString()
      });
    }
  }catch(err)
  {
    console.log(err);
    res.send("There was an error saving the exercise");
  }
});

app.get("/api/users/:_id/logs", async (req,res) =>
{
  const {from, to, limit} = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if(!user)
  {
    return res.send("User not found");
  }
  let dateObj = {};
  if (from)
  {
    dateObj["$gte"] = new Date(from);
  }
  if (to)
  {
    dateObj["$lte"] = new Date(to);
  }
  let filter = {
    user_id: id
  }
  if(from || to)
  {
    filter.date = dateObj;
  }
  const exercise = await Exercise.find(filter).limit(+limit ?? 500);
  
  const logs = exercise.map(e =>(
    {
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString()
    }));

  res.json({
    username: user.username,
    count: exercise.length,
    _id: user._id,
    logs
  });

});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
