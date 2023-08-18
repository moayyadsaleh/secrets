import dotenv from 'dotenv'; // Import dotenv
dotenv.config(); // Load environment variables

import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from 'passport';
import passportLocalMongoose from 'passport-local-mongoose';

const app = express();
app.use(express.static("Public"));
app.set('view engine', "ejs");
app.use(express.urlencoded({ extended: true }));

// Establish connection with MongoDB
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

// Define user schema and create User model
const userSchema = new mongoose.Schema({
    username: String, // Add username field
    email: String,
    password: String 
});

userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);

// Set up session, then initialize and use passport
app.set('trust proxy', 1);
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Change to false for local development
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Define get requests for different pages
app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get('/logout', (req, res) => {
    req.logout(() => {
        req.session.destroy(() => {
            res.redirect("/login"); // Redirect after logout
        });
    });
});

//register User
app.post("/register", (req, res) => {
    User.register({ email: req.body.email }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function () {
            res.redirect("/secrets");
        });
    });
});

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

// Implement the /login route to handle user login
app.post('/login', passport.authenticate("local", {
    successRedirect: '/secrets', // Redirect to secrets page upon successful login
    failureRedirect: '/login' // Redirect to login page upon failed login
}));
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
