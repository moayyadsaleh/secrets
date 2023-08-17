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
const uri = process.env.DATABASE_URL;
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
passport.use(User.createStrategy());

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


app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
      res.render("secrets");
    } else {
      res.redirect("/login");
    }
  });
  
  app.get('/logout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });


    app.post("/register", (req, res) => {
        const newUser = new User({ username: req.body.username });
    
        User.register(newUser, req.body.password, function(err, user) {
            if (err) {
                console.log(err);
                return res.redirect("/register");
            }
    
            // If registration is successful, you might want to log the user in automatically
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets"); // Redirect to the home page or a dashboard
            });
        });
    });

// Send Post request to handle user login
app.post('/login', (req, res, next) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    
    req.login(user, function(err) {
        if (err) {
            console.log(err);
            // Handle error appropriately, e.g., redirect to an error page
        } else {
            passport.authenticate("local")(req, res, function() {
                // Authentication successful, redirect to a secure page
                res.redirect("/secrets");
            });
        }
    });
});
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});