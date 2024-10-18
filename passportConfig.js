import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from 'bcrypt';
import util from 'util';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
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
