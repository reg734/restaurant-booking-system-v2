const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const restaurants = await pool.query('SELECT * FROM restaurants ORDER BY name');
    res.render('index', { restaurants: restaurants.rows });
  } catch (error) {
    res.render('index', { restaurants: [] });
  }
});

router.get('/booking', async (req, res) => {
  try {
    const restaurants = await pool.query('SELECT * FROM restaurants ORDER BY name');
    res.render('booking', { restaurants: restaurants.rows, message: null });
  } catch (error) {
    res.render('booking', { restaurants: [], message: '無法載入餐廳資料' });
  }
});

router.post('/booking', async (req, res) => {
  try {
    const { 
      restaurant_id,
      customer_name, 
      customer_phone, 
      customer_email, 
      booking_date, 
      booking_time, 
      party_size, 
      special_requests 
    } = req.body;

    const availableTables = await pool.query(`
      SELECT t.id, t.table_number, t.capacity
      FROM tables t
      WHERE t.restaurant_id = $1
      AND t.is_available = TRUE 
      AND t.capacity >= $4
      AND t.id NOT IN (
        SELECT table_id FROM bookings 
        WHERE booking_date = $2 
        AND booking_time = $3 
        AND status = 'confirmed'
      )
      ORDER BY t.capacity
      LIMIT 1
    `, [restaurant_id, booking_date, booking_time, party_size]);

    if (availableTables.rows.length === 0) {
      const restaurants = await pool.query('SELECT * FROM restaurants ORDER BY name');
      return res.render('booking', { 
        restaurants: restaurants.rows, 
        message: '抱歉，該時段沒有合適的桌位' 
      });
    }

    const tableId = availableTables.rows[0].id;
    
    const result = await pool.query(`
      INSERT INTO bookings (
        table_id, customer_name, customer_phone, customer_email, 
        booking_date, booking_time, party_size, special_requests
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [tableId, customer_name, customer_phone, customer_email, booking_date, booking_time, party_size, special_requests]);

    res.render('booking-success', { 
      booking: result.rows[0],
      table: availableTables.rows[0]
    });
  } catch (error) {
    const restaurants = await pool.query('SELECT * FROM restaurants ORDER BY name');
    res.render('booking', { 
      restaurants: restaurants.rows, 
      message: '預訂失敗，請稍後再試' 
    });
  }
});

module.exports = router;