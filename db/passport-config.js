const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcrypt');
const { PrismaClient } = require('./generated/prisma'); // Adjust path if needed
require('dotenv').config();

const prisma = new PrismaClient();

// --- Local Strategy (for username/password login) ---
passport.use(new LocalStrategy(
  // By default, LocalStrategy expects 'username' and 'password' fields in the request body
  async (username, password, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { username: username },
      });

      if (!user) {
        // User not found
        return done(null, false, { message: 'Incorrect username.' });
      }

      // Compare submitted password with hashed password in DB
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        // Passwords don't match
        return done(null, false, { message: 'Incorrect password.' });
      }

      // Credentials are valid, return the user object (without password)
      const { password: _, ...userWithoutPassword } = user; // Exclude password
      return done(null, userWithoutPassword);

    } catch (err) {
      return done(err); // Pass any errors to Passport
    }
  }
));

// --- JWT Strategy (for verifying tokens on protected routes) ---
const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken(); // Extracts token from "Bearer <token>" header
opts.secretOrKey = process.env.JWT_SECRET; // The secret key to verify the token signature

passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
  try {
    // jwt_payload contains the decoded payload (we'll put user ID in it)
    const user = await prisma.user.findUnique({
      where: { id: jwt_payload.sub }, // 'sub' (subject) is standard claim for user ID
    });

    if (user) {
      // User found, token is valid, return user object (without password)
       const { password: _, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
    } else {
      // User not found (e.g., user deleted after token was issued)
      return done(null, false);
    }
  } catch (err) {
    return done(err, false);
  }
}));