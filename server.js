const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);
app.use('/', bookingRoutes);

app.listen(PORT, () => {
  console.log(`服務器運行在 http://localhost:${PORT}`);
});