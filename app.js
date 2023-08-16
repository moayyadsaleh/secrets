import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import { Strategy as LocalStrategy } from "passport-local";

const app = express();
app.use(express.static("Public"));
app.set('view engine', "ejs");
app.use(express.urlencoded({ extended: true }));

//Set up Session
app.use(session({
    secret: "I don't like food.",
    resave: false,
    saveUninitialized: false,
  }));

//Always Place it after the session.
app.use(passport.initialize());  //passport should be initialized before using
app.use(passport.session());   // so once the session is set up, tell the app to use passport to deal with the session

//Establish connection with MongoDb 
const uri = 'mongodb://127.0.0.1:27017/userDB';
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(error => {
        console.error('Error connecting to MongoDB:', error);
    });

    const db = mongoose.connection;

db.on('connected', () => {
    console.log('Mongoose connected to ' + uri);
});

db.on('error', error => {
    console.error('Mongoose connection error:', error);
});

db.on('disconnected', () => {
    console.log('Mongoose disconnected');
});



// Define user schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String 
});

// plugin mongoose local to the schema
userSchema.plugin(passportLocalMongoose);

//Define DB Model
const User= new mongoose.model("User", userSchema);

// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//Define get requests for different pages
app.get("/", (req, res)=>{
    res.render("home");
});


app.get("/login", (req, res)=>{
    res.render("login");
});

app.get("/register", (req, res)=>{
    res.render("register");
});


//Send Post request to capture user registration. Use MD5 to hash password.
app.post('/register', async (req, res) => {

});
// Send Post request to handle user login
app.post('/login', async (req, res) => {

});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});