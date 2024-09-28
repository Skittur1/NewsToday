const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const listingModel = require("./models/listing.js");
const initdata = require("./init/data.js");
const override = require("method-override");
const userdb = require("./models/user.js");
const app = express();
const latestnews = require("./models/latestnews.js");
const latest = require("./models/latest.js");
const axios = require('axios');
const session=require('express-session');






app.use(session({
    secret: 'your_secret_key', // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Middleware and settings
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // To serve static files like images
app.use(override("_method"));


// Connect to MongoDB
async function main() {
    try {
        await mongoose.connect("mongodb://localhost:27017/wonderlust")
           
       let url="mongodb+srv://swapnilkittur:T7ziSW5IbeiEBVgK@skittur.laof4.mongodb.net/?retryWrites=true&w=majority&appName=Skittur"
        console.log('Connected to MongoDB');
        await initDB();
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
    }
}

// Initialize database with data
async function initDB() {
    try {
        // Check if the collection already has data
        const count = await listingModel.countDocuments();
        const count1 = await latest.countDocuments();
        const count3 = await latestnews.countDocuments();
        if (count === 0 && count1 === 0 && count3 === 0) {
            // Insert initial data if the collection is empty
            await listingModel.insertMany(initdata.data);
            await latest.insertMany(initdata.data);
            await latestnews.insertMany(initdata.data);
            console.log("Init data inserted");
        } else {
            console.log("Data already exists, skipping initialization");
        }
    } catch (error) {
        console.error("Error initializing database:", error);
    }
}

// Start the server
app.listen(8080, () => {
    console.log('Server is running on port 8080');
});
main();

// Routes




app.get('/', async (req, res) => {
    try {
        const listings = await listingModel.find({}).sort({ createdAt: -1 });

        // You can apply similar sorting if needed for 'latest' and 'latestnews'
        const newlatest = await latest.find({}).sort({ createdAt: -1 });
        const newlatestnews = await latestnews.find({}).sort({ createdAt: -1 });
        const isAdmin = req.session.isAdmin || false; // Get isAdmin from session
        res.render('index', { listings, newlatest,newlatestnews, isAdmin });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

app.post('/listings/new',(req,res)=>{
    res.render('new.ejs');
});

app.post('/listings/:id/updated', async (req, res) => {
    try {
        const listing = await listingModel.findById(req.params.id);
        if (!listing) {
            return res.status(404).send('Listing not found');
        }
        
        res.render('update.ejs', { listing });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});
app.delete('/listings/:id', async (req, res) => {
    try {
        const listingId = req.params.id;
        console.log('Deleting listing with ID:', listingId);

        const listing = await listingModel.findById(listingId);
        if (!listing) {
            return res.status(404).send('Listing not found');
        }

        await listingModel.findByIdAndDelete(listingId);
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});


app.put('/listings/:id/edit', async (req, res) => {
    try {
        const listingId = req.params.id;
        const { title, description, price, image_url, location, country } = req.body;

        const updatedListing = await listingModel.findByIdAndUpdate(listingId, {
           title,
            description,
            price,
            image:{
                url: image_url,
                filename: 'listingimage',
                
            },
            location,
            country
        }, { new: true });

        if (!updatedListing) {
            return res.status(404).send('Listing not found');
        }

        res.redirect(`/listings/${listingId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating listing');
    }
});

app.get('/listings/:id', async (req, res) => {
    try {
        const listingItem = await listingModel.findById(req.params.id);
        const isAdmin = req.session.isAdmin || false;
        if (!listingItem) {
            return res.status(404).send('Listing not found');
        }
        res.render('listing', { listing: listingItem,isAdmin });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});
app.post('/listings', async (req, res) => {
    try {
        // Extract form data from request body
        const { title, description,  image_url,} = req.body;

        // Create a new listing object
        let newListing = new listingModel({
            title,
            description,
          
            image:{
                url: image_url,
                filename: 'listingimage',
                
            },
          
           
        });

        // Save the new listing to the database
        await newListing.save();

        // Redirect to the listings page or any other page as needed
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating new listing');
    }
});
app.post('/latest', (req, res) => {
    res.render('latest');
});
app.post('/latest1', async (req, res) => {
    try {
        // Extract form data from request body
        const { image,h1,paragraph, } = req.body;

        // Create a new listing object
        let newlatest = new latest({
            
            image:{
                url: image,  
            },
            h1,
           paragraph,
        
            });

        // Save the new listing to the database
        await newlatest.save();

        // Redirect to the listings page or any other page as needed
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating new listing');
    }
});


app.get('/latest/slide/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        // Check if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send('Invalid ID format');
        }

        const latestItem = await latest.findById(id);
        const isAdmin = req.session.isAdmin || false;
        
        if (!latestItem) {
            return res.status(404).send('Listing not found');
        }

        res.render('latestedit', { latest:latestItem, isAdmin });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});
app.post('/sliding/:id/edit', async (req, res) => {
    try {
        const id = req.params.id;
        
        // Check if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send('Invalid ID format');
        }
        const latestItem = await latest.findById(id);
        const isAdmin = req.session.isAdmin || false;
        
        if (!latestItem) {
            return res.status(404).send('Listing not found');
        }
        res.render('latestupdate', { latest: latestItem, isAdmin });
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});
app.put('/sliding/:id/edit', async (req,res)=>{
    try {
        const latestId = req.params.id;
        const { image,h1,paragraph } = req.body;
        const updatedLatest = await latest.findByIdAndUpdate(latestId, {
            image:{
                url: image,  
            },
            h1,
            paragraph,
           
            
        }, { new: true });
        if (!updatedLatest) {
            return res.status(404).send('Listing not found');
        }
        res.redirect('/');
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating listing');
    }
});
app.delete('/sliding/:id/delete', async (req,res)=>{
    try {
        const latestId = req.params.id;
        console.log('Deleting latest with ID:', latestId);  
        const latestItem = await latest.findByIdAndDelete(latestId);
        if (!latestItem) {
            return res.status(404).send('Listing not found');
        }
        res.redirect('/');
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});
app.post('/latestnews', async (req,res)=>{
    res.render('latestnews');
});
app.post('/latestnews1', async (req,res)=>{
    try {
        const { latestparagraph } = req.body;
        let newLatest = new latestnews({
            latestparagraph,
        });
        await newLatest.save();
        res.redirect('/');
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating new listing');
    
    }

});
app.delete('/:id', async (req, res)=>{
    try {
        const id = req.params.id;
        console.log('Deleting with ID:', id);
        const item = await latestnews.findByIdAndDelete(id);
        if (!item) {
            return res.status(404).send('Item not found');
        }
        res.redirect('/');
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }

});


app.get('/world', async (req, res) => {
    const apiKey = '776ba8b24e8344fd9c26ffd4560c14f3';
    const url = `https://newsapi.org/v2/everything?q=world&from=2024-09-19&sortBy=publishedAt&apikey=${apiKey}`;

    try {
        const response = await axios.get(url);
        const article = response.data.articles || [];

        // Log the titles and descriptions
        const articles = article.filter(article => article.urlToImage);
        // Render the data using EJS template
        res.render('world', { news: articles });

    } catch (error) {
        console.error('Error Details:', error.response ? error.response.data : error.message);
        res.status(500).send("An error occurred while fetching the news.");
    }
});



app.get('/entertenment', async (req, res) => {
    const apiKey = '776ba8b24e8344fd9c26ffd4560c14f3';
    const url = `https://newsapi.org/v2/everything?q=Bollywood&from=2024-09-18&sortBy=publishedAt&apikey=${apiKey}`;

    try {
        const response = await axios.get(url);
        const article = response.data.articles || [];

        // Log the titles and descriptions
        const articles = article.filter(article => article.urlToImage);
        // Render the data using EJS template
        res.render('entertenment', { news: articles });

    } catch (error) {
        console.error('Error Details:', error.response ? error.response.data : error.message);
        res.status(500).send("An error occurred while fetching the news.");
    }
});


app.get('/finance', async (req, res) => {
    const apiKey = '776ba8b24e8344fd9c26ffd4560c14f3';
    const url = `https://newsapi.org/v2/everything?q=Finance&from=2024-09-18&sortBy=publishedAt&apikey=${apiKey}`;

    try {
        const response = await axios.get(url);
        const article = response.data.articles || [];

        // Log the titles and descriptions
        const articles = article.filter(article => article.urlToImage);
        // Render the data using EJS template
        res.render('finance', { news: articles });

    } catch (error) {
        console.error('Error Details:', error.response ? error.response.data : error.message);
        res.status(500).send("An error occurred while fetching the news.");
    }
});

app.get('/sports', async (req, res) => {
    const apiKey = '776ba8b24e8344fd9c26ffd4560c14f3';
    const url = `https://newsapi.org/v2/everything?q=olympics&from=2024-09-18&sortBy=publishedAt&apikey=${apiKey}`;

    try {
        const response = await axios.get(url);
        const article = response.data.articles || [];

        // Log the titles and descriptions
        const articles = article.filter(article => article.urlToImage);
        // Render the data using EJS template
        res.render('sports', { news: articles });

    } catch (error) {
        console.error('Error Details:', error.response ? error.response.data : error.message);
        res.status(500).send("An error occurred while fetching the news.");
    }
});
  
app.get('/jobs', async (req, res) => {
    const apiKey = '776ba8b24e8344fd9c26ffd4560c14f3';
    const url = `https://newsapi.org/v2/everything?q=Jobs&from=2024-09-18&sortBy=publishedAt&apikey=${apiKey}`;

    try {
        const response = await axios.get(url);
        const article = response.data.articles || [];

        // Log the titles and descriptions
        const articles = article.filter(article => article.urlToImage);
        // Render the data using EJS template
        res.render('jobs', { news: articles });

    } catch (error) {
        console.error('Error Details:', error.response ? error.response.data : error.message);
        res.status(500).send("An error occurred while fetching the news.");
    }
});
  // Start the server
 
app.get('/signup',(req, res) => {
    res.render('signup', { message: null });
});

app.post('/signup', async (req, res) => {
    try {
        const { username, email,mobile,dob,address, password, } = req.body;
        const registeredUser = await userdb.findOne({ email });

        if (registeredUser) {
            return res.render('signup', { message: 'Email already exists' });
           
        }
        
        let user = new userdb({ username, email,mobile,dob,address, password });
        await user.save();

        res.render('login', { message: 'Sign up successful!' });
    } catch (error) {
        console.error(error);
        res.status(500).render('signup', { message: 'Error signing up' });
    }
});
app.get('/login', (req, res) => {
 
    res.render('login', {message:null}); // Render the admin dashboard or session page
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // Assuming user validation logic is correct
        if (email !== 'swapnilkittur@gmail.com' || password !== 'Swap8497#') {
            return res.render('login', { message: 'Invalid credentials' });
        }

        req.session.user = { email: email };
        req.session.isAdmin = (email === 'swapnilkittur@gmail.com'); // Set isAdmin in session

        res.redirect('/'); // Redirect to the listings page
    } catch (err) {
        console.error(err);
        res.render('login', { message: 'An error occurred, please try again later.' });
    }
});

// Logout route to handle session termination
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.render('error', { message: 'Failed to log out. Please try again.' });
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.redirect('/'); // Redirect to the login page
    });
});

app.get('/about', (req, res) => {
    res.render('aboutus');
    });

    app.get('/privacy', (req, res) => {
        res.render('privacy');
        });

        app.get('/terms', (req, res) => {
            res.render('terms');
            });

            app.get('/contact', (req, res) => {
                res.render('contact');
                });