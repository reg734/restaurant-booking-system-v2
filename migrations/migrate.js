require('dotenv').config();
const pool = require('../config/database');

const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        address VARCHAR(255),
        phone VARCHAR(20),
        opening_hours JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tables (
        id SERIAL PRIMARY KEY,
        restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
        table_number VARCHAR(10) NOT NULL,
        capacity INTEGER NOT NULL,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        table_id INTEGER REFERENCES tables(id) ON DELETE CASCADE,
        customer_name VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_email VARCHAR(100),
        booking_date DATE NOT NULL,
        booking_time TIME NOT NULL,
        party_size INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'confirmed',
        special_requests TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_date_time 
      ON bookings(booking_date, booking_time);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_table_id 
      ON bookings(table_id);
    `);

    await pool.query(`
      INSERT INTO users (username, password, role) 
      VALUES ('admin', '$2a$10$6bwa5pSke0b7Zfgd8Z860eHSxOg.bzYMP8b043XUVrW0mvSWkjJge', 'admin')
      ON CONFLICT (username) DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO restaurants (name, description, address, phone, opening_hours)
      VALUES (
        '美味餐廳',
        '提供正宗中式料理，環境優雅舒適',
        '台北市信義區信義路五段7號',
        '02-2345-6789',
        '{"monday": "11:00-22:00", "tuesday": "11:00-22:00", "wednesday": "11:00-22:00", "thursday": "11:00-22:00", "friday": "11:00-22:00", "saturday": "11:00-22:00", "sunday": "11:00-22:00"}'
      )
      ON CONFLICT DO NOTHING;
    `);

    const restaurant = await pool.query('SELECT id FROM restaurants LIMIT 1');
    if (restaurant.rows.length > 0) {
      const restaurantId = restaurant.rows[0].id;
      
      for (let i = 1; i <= 10; i++) {
        await pool.query(`
          INSERT INTO tables (restaurant_id, table_number, capacity)
          VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING;
        `, [restaurantId, `A${i}`, i <= 2 ? 2 : i <= 6 ? 4 : 6]);
      }
    }

    console.log('資料庫表格創建成功！');
    console.log('預設管理員帳號: admin / password');
    
  } catch (error) {
    console.error('資料庫遷移失敗:', error);
  } finally {
    pool.end();
  }
};

createTables();