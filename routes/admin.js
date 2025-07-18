const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateSession, comparePassword } = require('../middleware/auth');

router.get('/login', (req, res) => {
  res.render('admin/login', { error: null });
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return res.render('admin/login', { error: '帳號或密碼錯誤' });
    }
    
    const user = result.rows[0];
    const isValidPassword = await comparePassword(password, user.password);
    
    if (!isValidPassword) {
      return res.render('admin/login', { error: '帳號或密碼錯誤' });
    }
    
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };
    
    res.redirect('/admin/dashboard');
  } catch (error) {
    res.render('admin/login', { error: '登入失敗，請稍後再試' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

router.get('/dashboard', authenticateSession, async (req, res) => {
  try {
    const todayBookings = await pool.query(`
      SELECT b.*, t.table_number, r.name as restaurant_name
      FROM bookings b
      JOIN tables t ON b.table_id = t.id
      JOIN restaurants r ON t.restaurant_id = r.id
      WHERE b.booking_date = CURRENT_DATE
      ORDER BY b.booking_time
    `);
    
    const upcomingBookings = await pool.query(`
      SELECT b.*, t.table_number, r.name as restaurant_name
      FROM bookings b
      JOIN tables t ON b.table_id = t.id
      JOIN restaurants r ON t.restaurant_id = r.id
      WHERE b.booking_date > CURRENT_DATE
      ORDER BY b.booking_date, b.booking_time
      LIMIT 10
    `);
    
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN booking_date = CURRENT_DATE THEN 1 END) as today_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings
      FROM bookings
    `);
    
    res.render('admin/dashboard', {
      user: req.session.user,
      todayBookings: todayBookings.rows,
      upcomingBookings: upcomingBookings.rows,
      stats: stats.rows[0]
    });
  } catch (error) {
    res.render('admin/dashboard', { 
      user: req.session.user,
      error: '無法載入儀表板資料',
      todayBookings: [],
      upcomingBookings: [],
      stats: {}
    });
  }
});

router.get('/bookings', authenticateSession, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    
    const result = await pool.query(`
      SELECT b.*, t.table_number, r.name as restaurant_name
      FROM bookings b
      JOIN tables t ON b.table_id = t.id
      JOIN restaurants r ON t.restaurant_id = r.id
      ORDER BY b.booking_date DESC, b.booking_time DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    const totalCount = await pool.query('SELECT COUNT(*) FROM bookings');
    const totalPages = Math.ceil(totalCount.rows[0].count / limit);
    
    res.render('admin/bookings', {
      user: req.session.user,
      bookings: result.rows,
      currentPage: page,
      totalPages: totalPages
    });
  } catch (error) {
    res.render('admin/bookings', { 
      user: req.session.user,
      error: '無法載入預訂資料',
      bookings: [],
      currentPage: 1,
      totalPages: 1
    });
  }
});

router.post('/bookings/:id/cancel', authenticateSession, async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query(`
      UPDATE bookings 
      SET status = 'cancelled' 
      WHERE id = $1
    `, [id]);
    
    res.redirect('/admin/bookings');
  } catch (error) {
    res.redirect('/admin/bookings');
  }
});

module.exports = router;