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



// Define DB schema
const userSchema = {
    email: String,
    password: String // Use lowercase "password"
  };

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


//Send Post request to capture user registration
app.post('/register', async (req, res) => {
    const email = req.body.username;
    const password = req.body.passWord;
  
    try {
      const newUser = new User({
        email: email,
        password: password
      });
  
      await newUser.save();
      console.log('User registered successfully');
      res.render('secrets'); // Render 'secrets' view after successful registration
    } catch (err) {
      console.error('Error registering user:', err);
      res.status(500).send('Error registering user');
    }
  });

 //Send post request to log in. Check user input against user name and password
 app.post('/login', async (req, res) => {
    const email = req.body.username;
    const password = req.body.passWord;
  
    try {
      const user = await User.findOne({ email: email }); // Find user by email
  
      if (user) {
        if (user.password === password) {
          console.log("Email and password are matching");
          res.render('secrets');
        } else {
          console.log("Incorrect password");
          res.send("Error logging in. Incorrect password");
        }
      } else {
        console.log("User not found");
        res.send("Error logging in. User not found");
      }
    } catch (err) {
      console.error('Error during login:', err);
      res.status(500).send('Error during login');
    }
  });

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});