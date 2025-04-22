const express = require('express')
const passport = require('passport')
const { PrismaClient } = require('./generated/prisma')
const jwt = require('jsonwebtoken')
const { hashPassword } = require('./utils/passwordutils');
const cors = require("cors");


require('dotenv').config();
require('./passport-config');

const app = express()

app.use(cors());
app.use(express.json()); // <-- Add this to parse JSON request bodies
app.use(express.urlencoded({ extended: false })); // <-- Add this if using form submissions (optional for API)
app.use(passport.initialize()); // <-- Initialize Passport

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

const prisma = new PrismaClient();

app.get('/api' , (req, res) => {
  res.json({message: "Hello World"})
})

app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
      if (err) {
        return next(err); // Handle potential errors passed from strategy
      }
      if (!user) {
        // Authentication failed (user not found or password incorrect)
        return res.status(401).json({ message: info.message || 'Login failed' });
      }
  
      // Authentication successful, user object is available
      req.login(user, { session: false }, (loginErr) => { // Log the user in (though session is false)
        if (loginErr) {
          return next(loginErr);
        }
  
        // --- Generate JWT ---
        const payload = {
          sub: user.id, // Subject: Unique identifier for the user (standard claim)
          username: user.username,
          // Add other non-sensitive info if needed
        };
        const secret = process.env.JWT_SECRET;
        const options = {
          expiresIn: '30000', // Token expiration time (e.g., 1 hour)
        };
  
        const token = jwt.sign(payload, secret, options);
  
        // Send the token back to the client
        return res.json({ message: 'Login successful', token: token });
      });
    })(req, res, next); // <--- Important: call the middleware function returned by passport.authenticate
});

app.get('/api/blogs',
    passport.authenticate('jwt', { session: false }), // Protect this route
    async (req, res, next) => {
      try {
        const userBlogs = await prisma.blog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            author: true
          }
        });
        res.json(userBlogs);
      } catch (err) {
        console.error("Error fetching user's blogs:", err);
        res.status(500).json({ message: 'Error fetching blogs' });
      }
    }
)

app.get(
    '/api/blogs/mine',
    passport.authenticate('jwt', { session: false }), // Protect this route
    async (req, res, next) => {
      const userId = req.user.id;
      try {
        const userBlogs = await prisma.blog.findMany({
          where: { userId: userId },
          orderBy: { createdAt: 'desc' }
        });
        res.json(userBlogs);
      } catch (err) {
        console.error("Error fetching user's blogs:", err);
        res.status(500).json({ message: 'Error fetching blogs' });
      }
    }
  );

app.post('/api/createUser', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username: username,
        password: hashedPassword,
      },
    });
    res.json(user);
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ message: 'Error creating user' });
  }
});


const PORT = 3000
app.listen(PORT, () => {
  console.log(`listening on port http://localhost:${PORT}`)
})