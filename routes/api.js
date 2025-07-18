const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

router.get('/tables', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, r.name as restaurant_name 
      FROM tables t
      JOIN restaurants r ON t.restaurant_id = r.id
      WHERE t.is_available = TRUE
      ORDER BY t.table_number
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: '無法獲取桌位資訊' });
  }
});

router.get('/tables/available', async (req, res) => {
  try {
    const { date, time, party_size } = req.query;
    
    const result = await pool.query(`
      SELECT t.*, r.name as restaurant_name 
      FROM tables t
      JOIN restaurants r ON t.restaurant_id = r.id
      WHERE t.is_available = TRUE 
      AND t.capacity >= $3
      AND t.id NOT IN (
        SELECT table_id FROM bookings 
        WHERE booking_date = $1 
        AND booking_time = $2 
        AND status = 'confirmed'
      )
      ORDER BY t.table_number
    `, [date, time, party_size]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: '無法獲取可用桌位' });
  }
});

router.post('/bookings', async (req, res) => {
  try {
    const { 
      table_id, 
      customer_name, 
      customer_phone, 
      customer_email, 
      booking_date, 
      booking_time, 
      party_size, 
      special_requests 
    } = req.body;

    const checkAvailability = await pool.query(`
      SELECT id FROM bookings 
      WHERE table_id = $1 
      AND booking_date = $2 
      AND booking_time = $3 
      AND status = 'confirmed'
    `, [table_id, booking_date, booking_time]);

    if (checkAvailability.rows.length > 0) {
      return res.status(400).json({ error: '該時段已被預訂' });
    }

    const result = await pool.query(`
      INSERT INTO bookings (
        table_id, customer_name, customer_phone, customer_email, 
        booking_date, booking_time, party_size, special_requests
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [table_id, customer_name, customer_phone, customer_email, booking_date, booking_time, party_size, special_requests]);

    res.status(201).json({ 
      message: '預訂成功！', 
      booking: result.rows[0] 
    });
  } catch (error) {
    res.status(500).json({ error: '預訂失敗，請稍後再試' });
  }
});

router.get('/bookings', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, t.table_number, r.name as restaurant_name
      FROM bookings b
      JOIN tables t ON b.table_id = t.id
      JOIN restaurants r ON t.restaurant_id = r.id
      ORDER BY b.booking_date DESC, b.booking_time DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: '無法獲取預訂資訊' });
  }
});

router.put('/bookings/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await pool.query(`
      UPDATE bookings 
      SET status = $1 
      WHERE id = $2 
      RETURNING *
    `, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '預訂不存在' });
    }
    
    res.json({ message: '狀態更新成功', booking: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: '無法更新預訂狀態' });
  }
});

module.exports = router;