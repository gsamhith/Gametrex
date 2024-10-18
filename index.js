import express from 'express';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt'; 
import pg from 'pg';
import flash from 'express-flash';
import session from 'express-session';
import util from 'util';
import passport from 'passport';
import initializePassport from './passportConfig.js';
import sendSubscriptionEmail from './emailSend.js';
import bodyParser from 'body-parser';
// import https from 'https';
import NewsAPI from 'newsapi';
import dotenv from 'dotenv';
// import { title } from 'process';

initializePassport(passport);

const app = express();
const PORT = process.env.PORT || 3000;
const newsapi = new NewsAPI('process.env.NEWS_API_KEY');

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
}));
dotenv.config();

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());
app.set('view engine', 'ejs');

const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});
db.connect();

const dbQuery = util.promisify(db.query).bind(db);




// app.get('/', async(req, res) => {
//     res.render('index');
// });
app.get('/', async (req, res) => {
    try {
        const response = await newsapi.v2.everything({
            q: 'games',
            language: 'en',
        });
        const title = response.articles[0].title;
        const description = response.articles[0].description;
        const url = response.articles[0].url;

        // demo purpose
        // const title = "Gaming News";
        // const description ="Get the latest news on games and gaming industry";
        // const url = "https://newsapi.org/";

        res.render('index', { title, description, url});
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/players/signup',checkAuthenticated, async (req, res) => {
    res.render('signup');
});
app.get('/players/signin',checkAuthenticated, async (req, res) => {
    res.render('signin');
});
app.get('/library', async (req, res) => {
    try {
        const playerId = req.user.player_id;
        const query = `SELECT DISTINCT * FROM game WHERE player_id = $1`;
        const results = await dbQuery(query, [playerId]);
        const games = results.rows;
        res.render('library', { games });
    } catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.get("/playerAchievements", async (req, res) => {
    try {
        const playerId = req.user.player_id; // Assuming the player id is stored in req.user.id
        const query = `SELECT DISTINCT * FROM achievements JOIN items ON achievements.game_id = items.game_id WHERE player_id = $1`;
        const results = await dbQuery(query, [playerId]);
        const achievements = results.rows;
        // console.log(achievements);
        res.render('playerAchievements', { achievements});
    } catch (error) {
        console.error('Error fetching achievements:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/players/dashboard', checkNotAuthenticated , async (req, res) => {
    res.render('dashboard');
});
app.get('/players/playerAchievements', checkNotAuthenticated , async (req, res) => {
    res.render('playerAchievements');
});
app.get('/players/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error("Logout error:", err);
            return next(err);
        }
        req.flash('success_msg', 'You have logged out');
        res.redirect('/players/signin');
    });
});


app.post('/players/signup', async (req, res) => {
    const { username, email, password, password2 } = req.body;
    // console.log({} = req.body);
    let errors = [];
    if (!username || !email || !password || !password2) {
        errors.push({ message: "Please enter all fields" });
    }
    if (password.length < 8) {
        errors.push({ message: "Password should be atleast 8 characters" });
    }
    if (password != password2) {
        errors.push({ message: "Passwords do not match" });
    }
    if (errors.length > 0) {
        res.render('signup', { errors });
    } else {
        let hashedPassword = await bcrypt.hash(password, 10);
        try {
            const results = await dbQuery(
                `SELECT * FROM players WHERE email = $1`,
                [email]
            );
            if (results.rows.length > 0) {
                errors.push({ message: "Email already registered" });
                res.render('signup', { errors });
            } else {
                const currentDate = new Date();
                const results = await dbQuery(
                    `INSERT INTO players (name, email, password, password2, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING email, password`,
                    [username, email, hashedPassword, password2, currentDate]
                );
                req.flash('success_msg', 'You have successfully registered. Please log in.');
                res.redirect('/players/signin');
            }
        } catch (err) {
            console.error(err);
            res.send("Error registering user");
        }
    }
});

app.post('/players/signin', passport.authenticate('local', { 
    successRedirect: '/players/dashboard',
    failureRedirect: '/players/signin',
    failureFlash: true
}));

// get news
app.get('/news', async (req, res) => {
    let title, description, url;
    try {
        const response = await newsapi.v2.everything({
            q: 'games',
            language: 'en',
        });
        // console.log(response);
        const articles = response.articles;
        res.render('news', { articles});

        // to test
        // title = "Gaming News";
        // description ="Get the latest news on games and gaming industry";
        // url = "https://newsapi.org/";

        // res.render('news', { title, description, url});
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).send('Internal Server Error');
    }
});

// email sending
app.post('/players/subscribe', async (req, res) => {
    const email = req.body.subemail;
    if (!email) {
        res.status(400).send(`<script>alert('Please enter an email address'); window.location="/";</script>`);
    } else {
        // Check if email is already subscribed
        const existingEmail = await dbQuery('SELECT * FROM subscription WHERE email = $1', [email]);
        if (existingEmail.rows.length > 0) {
            // Email is already subscribed
            res.send(`<script>alert('Already Subscribed.'); window.location="/";</script>`);
        } else {
            // Save email to database
            const submail = await dbQuery('INSERT INTO subscription (email) VALUES ($1) ON CONFLICT(email) DO NOTHING', [email]);
            sendSubscriptionEmail(email);
            res.render('confirmation');
        }
    }
});


// to cheeck if user is authenticated or not
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/players/dashboard');
    }
    next();
}
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/players/signin');
}

app.listen(PORT, () => {
    console.log(`Listening on port http://localhost:${PORT}`);
});