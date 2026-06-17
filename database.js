const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./hotel.db');
const bcrypt = require('bcrypt');

db.serialize(() => {
    // 1. إنشاء جدول المستخدمين
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        email TEXT UNIQUE, 
        password TEXT, 
        full_name TEXT,
        is_admin INTEGER
    )`);
    
    // التأكد من وجود مستخدم الأدمن وتشفير كلمة مروره إذا لم يكن موجوداً
    // تم استخدام دالة التحقق هنا لضمان التوافق مع نظام التشفير
    bcrypt.hash('123456', 10, (err, hash) => {
        if (!err) {
            db.run(`INSERT OR IGNORE INTO users (email, password, full_name, is_admin) VALUES ('admin@hotel.com', ?, 'Administrator', 1)`, [hash]);
        }
    });

    // التأكد من وجود الأعمدة المطلوبة (تحديث هيكلي)
    db.all("PRAGMA table_info(users)", (err, columns) => {
        const colNames = columns.map(c => c.name);
        if (!colNames.includes('full_name')) {
            db.run(`ALTER TABLE users ADD COLUMN full_name TEXT`);
        }
    });

    // 2. جدول الغرف
    db.run(`CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price INTEGER,
        capacity INTEGER,
        image_url TEXT
    )`);

    // 3. جدول المنيو
    db.run(`CREATE TABLE IF NOT EXISTS menu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price INTEGER,
        type TEXT,
        image_url TEXT
    )`);

    // 4. جدول المرافق
    db.run(`CREATE TABLE IF NOT EXISTS facilities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        hours TEXT,
        price INTEGER,
        image_url TEXT
    )`);

    // 5. جدول العروض
    db.run(`CREATE TABLE IF NOT EXISTS offers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        details TEXT,
        price INTEGER,
        start_date TEXT,
        end_date TEXT,
        image_url TEXT
    )`, () => {
        db.all("PRAGMA table_info(offers)", (err, columns) => {
            const hasImageUrl = columns.find(col => col.name === 'image_url');
            if (!hasImageUrl) {
                db.run(`ALTER TABLE offers ADD COLUMN image_url TEXT`);
            }
        });
    });

    // 6. جدول المدفوعات
    db.run(`CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        user_name TEXT,
        item_name TEXT,
        amount INTEGER,
        date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, () => {
        db.all("PRAGMA table_info(payments)", (err, columns) => {
            const colNames = columns.map(c => c.name);
            if (!colNames.includes('user_id')) db.run(`ALTER TABLE payments ADD COLUMN user_id INTEGER`);
            if (!colNames.includes('user_name')) db.run(`ALTER TABLE payments ADD COLUMN user_name TEXT`);
        });
    });

    // 7. جدول الإعدادات
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )`);

    const settings = [
        ['map_url', ''], ['instagram', ''], ['tiktok', ''], 
        ['facebook', ''], ['email', ''], ['whatsapp', ''], 
        ['hotel_name', 'My Hotel Name'], 
        ['bg_url', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80']
    ];
    settings.forEach(s => db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, s));

    // 8. جدول الواي فاي
    db.run(`CREATE TABLE IF NOT EXISTS wifi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        pass TEXT
    )`);
    db.run(`INSERT OR IGNORE INTO wifi (id, name, pass) VALUES (1, 'Hotel_WiFi', '12345678')`);

    // 9. جدول النوادل
    db.run(`CREATE TABLE IF NOT EXISTS waiters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        phone TEXT,
        gender TEXT
    )`);
});

module.exports = db;