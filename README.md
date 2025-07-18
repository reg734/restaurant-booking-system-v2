# 餐廳訂位系統

一個完整的餐廳訂位管理系統，支援前台訂位和後台管理功能。

## 功能特色

- 🍽️ **前台訂位**：客戶可以線上選擇餐廳、時間、人數進行訂位
- 👨‍💼 **後台管理**：管理員可以查看所有訂位、統計資料、管理訂位狀態
- 🔒 **安全認證**：後台需要登入才能訪問
- 📊 **即時統計**：訂位統計、今日訂位、即將到來的訂位
- 🎯 **智能分配**：自動分配合適的桌位

## 技術棧

- **後端**：Node.js + Express
- **資料庫**：PostgreSQL
- **前端**：EJS 模板引擎 + Bootstrap 5
- **認證**：JWT + Session
- **部署**：Zeabur

## 資料庫結構

### 主要表格
- `users` - 管理員用戶
- `restaurants` - 餐廳資訊
- `tables` - 桌位資訊
- `bookings` - 訂位記錄

## 快速開始

### 1. 安裝依賴
```bash
npm install
```

### 2. 設定環境變數
複製 `.env.example` 到 `.env` 並修改配置：

```env
DATABASE_URL=postgresql://username:password@localhost:5432/restaurant_booking
JWT_SECRET=your-jwt-secret-key
SESSION_SECRET=your-session-secret-key
PORT=3000
NODE_ENV=development
```

### 3. 建立資料庫並執行遷移
```bash
# 建立資料庫表格並導入初始資料
npm run migrate
```

### 4. 啟動開發服務器
```bash
npm run dev
```

### 5. 訪問應用
- 前台：http://localhost:3000
- 後台：http://localhost:3000/admin/login
- 預設管理員帳號：`admin` / `password`

## 部署到 Zeabur

### 1. 推送到 GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. 在 Zeabur 部署
1. 登入 [Zeabur](https://zeabur.com)
2. 點選 "Create Project"
3. 選擇 "Deploy from GitHub"
4. 選擇您的 repository
5. 添加 PostgreSQL 服務
6. 設定環境變數

### 3. 環境變數設定
在 Zeabur 專案設定中添加以下環境變數：
- `DATABASE_URL`: PostgreSQL 連接字串 (Zeabur 會自動生成)
- `JWT_SECRET`: 您的 JWT 密鑰
- `SESSION_SECRET`: 您的 Session 密鑰
- `NODE_ENV`: `production`

### 4. 執行資料庫遷移
部署完成後，在 Zeabur 控制台執行：
```bash
npm run migrate
```

## API 文檔

### 公開 API
- `GET /api/tables` - 獲取所有桌位
- `GET /api/tables/available` - 獲取可用桌位
- `POST /api/bookings` - 建立訂位

### 管理員 API (需認證)
- `GET /api/bookings` - 獲取所有訂位
- `PUT /api/bookings/:id/status` - 更新訂位狀態

## 授權
MIT License