import 'dotenv/config';
import md5 from 'md5';
import express from 'express';
import mongoose from 'mongoose';
const app = express();
app.use(express.static("Public"));
app.set('view engine', "ejs");
app.use(express.urlencoded({ extended: true }));

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



//Define DB Model
const User= new mongoose.model("User", userSchema);

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
    const email = (req.body.username);
    const password = md5(req.body.password); // Use the correct field name
    
    try {
        const newUser = new User({
            email: email,
            password: password
        });

        await newUser.save();
        console.log('User registered successfully');
        res.render('secrets');
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).send('Error registering user');
    }
});

// Send Post request to handle user login
app.post('/login', async (req, res) => {
    const email = req.body.username;
    const password = md5(req.body.password);

    try {
        // Find a user with the provided email
        const user = await User.findOne({ email: email });

        if (user && user.password === password) {
            console.log('User logged in successfully');
            res.render('secrets'); // Render 'secrets' view after successful login
        } else {
            console.log('Invalid email or password');
            res.status(401).send('Invalid email or password');
        }
    } catch (err) {
        console.error('Error logging in user:', err);
        res.status(500).send('Error logging in user');
    }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});