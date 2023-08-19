import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passportLocalMongoose from 'passport-local-mongoose';

const app = express();
app.use(express.static("public"));
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
    email: String,
    password: String,
    googleId: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.statics.findOrCreate = async function(condition) {
    let user = await this.findOne(condition);

    if (!user) {
        user = await this.create(condition);
    }

    return user;
};

const User = mongoose.model("User", userSchema);

// Set up session and passport middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  async (accessToken, refreshToken, profile, cb) => {
    try {
      console.log("Google Strategy Callback - Profile:", profile);

      // Find or create the user in your database
      const user = await User.findOrCreate({ googleId: profile.id });

      console.log("User from findOrCreate:", user);

      // Pass the user to the callback
      return cb(null, user);
    } catch (error) {
      console.error("Error in findOrCreate:", error);
      return cb(error, null);
    }
  }
));
//Serialize and deserialize users
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});
// Define get requests for different pages
app.get("/", (req, res) => {
    res.render("home");
});

app.get("/auth/google", passport.authenticate('google', { scope: ["profile", "email"] }));


app.get("/auth/google/secrets", passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    // Successful authentication, fetch user information and redirect to secrets.
    res.render('secrets', { user: req.user });
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

// Register User
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

//secure the secrets page
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
