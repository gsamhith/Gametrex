import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from 'bcrypt';
import util from 'util';
import pg from 'pg';

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "dbmsingaming",
    password: "pgDATAbase",
    port: 5432,
});
db.connect();

const dbQuery = util.promisify(db.query).bind(db);

function initialize(passport) {
    const authenticateUser = async (email, password, done) => {
        dbQuery(`SELECT * FROM players WHERE email = $1`, [email] , (err, results) => {
            if (err) {
                throw err;
            }
            if (results.rows.length > 0) {
                const player = results.rows[0];
                bcrypt.compare(password, player.password, (err, isMatch) => {
                    if (err) {
                        throw err;
                    }
                    if (isMatch) {
                        return done(null, player);
                    } else {
                        return done(null, false, { message: "Password is incorrect" });
                    }
                });
            } else {
                return done(null, false, { message: "Email is not registered" });
            }
        
        });
    }
    passport.use(
        new LocalStrategy(
            {
                usernameField: 'email',
                passwordField: 'password'
            },
            authenticateUser
        )
    );
    passport.serializeUser(async (player, done) => {
        if (player && player.id) {
            done(null, player.id);
        } else {
            done(new Error("Invalid player object"));
        }
    });
    
    passport.deserializeUser(async (id, done) => {
        try {
            const player = await dbQuery(`SELECT * FROM players WHERE id = $1`, [id]);
            done(null, player);
        } catch (error) {
            done(error);
        }
    });
    
    
}

export default initialize;



// Path: index.js
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from 'bcrypt';
import util from 'util';
import pg from 'pg';

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "dbmsingaming",
    password: "pgDATAbase",
    port: 5432,
});
db.connect();

const dbQuery = util.promisify(db.query).bind(db);

async function initialize(passport) {
    const authenticateUser = async (email, password, done) => {
        try {
            const results = await dbQuery(`SELECT * FROM players WHERE email = $1`, [email]);
            
            if (results.rows.length > 0) {
                const player = results.rows[0];
                const isMatch = await bcrypt.compare(password, player.password);

                if (isMatch) {
                    return done(null, player);
                } else {
                    return done(null, false, { message: "Password is incorrect" });
                }
            } else {
                return done(null, false, { message: "Email is not registered" });
            }
        } catch (err) {
            return done(err);
        }
    };

    passport.use(
        new LocalStrategy(
            {
                usernameField: 'email',
                passwordField: 'password'
            },
            authenticateUser
        )
    );

    passport.serializeUser((player, done) => {
        console.log("Serialized user:", player);
        
        if (player && player.player_id) {
            done(null, player.player_id);
        } else {
            console.error("Invalid player object:", player);
            done(new Error("Invalid player object"));
        }
    });
    

    passport.deserializeUser(async (player_id, done) => {
        try {
            const results = await dbQuery(`SELECT * FROM players WHERE player_id = $1`, [player_id]);
            const player = results.rows[0];
            done(null, player);
        } catch (err) {
            done(err, null);
        }
    });
}

export default initialize;
