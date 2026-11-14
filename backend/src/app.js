// Builds the Express app (kept separate from server.js so it is easy to test).
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { ok } = require('./utils/apiResponse');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());            // allow the Flutter web app (another port) to call us
app.use(express.json());    // parse JSON request bodies
app.use(morgan('dev'));     // log each request in the terminal

// Simple check that the server is alive.
app.get('/api/health', (req, res) => ok(res, { time: new Date() }, 'FoodLoop API is running'));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/foods', require('./routes/foodRoutes'));
app.use('/api/claims', require('./routes/claimRoutes'));

// Public: the one impact number shown on the welcome screen before login.
app.get('/api/impact', require('./controllers/impactController').summary);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
