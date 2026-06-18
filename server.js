const express = require('express');
const db = require('./database');
const multer = require('multer');
const bcrypt = require('bcryptjs'); // تم استبدال bcrypt بـ bcryptjs المتوافقة مع الرفع السحابي
const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static('uploads'));

// 1. نظام المستخدمين
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email=?", [email], async (err, user) => {
        if (err || !user) return res.json({ success: false });
        
        const match = await bcrypt.compare(password, user.password);
        if (match) res.json({ success: true, isAdmin: user.is_admin, userId: user.id, fullName: user.full_name });
        else res.json({ success: false });
    });
});

app.post('/api/register', async (req, res) => {
    const { fullName, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    db.run("INSERT INTO users (full_name, email, password, is_admin) VALUES (?, ?, ?, 0)", [fullName, email, hash], (err) => {
        if (err) res.json({ success: false });
        else res.json({ success: true });
    });
});

// 2. نظام إدارة الغرف
app.get('/api/rooms', (req, res) => {
    db.all("SELECT * FROM rooms", [], (err, rows) => res.json(rows || []));
});

app.post('/api/rooms', upload.single('image'), (req, res) => {
    const { name, price, capacity } = req.body;
    const imageUrl = req.file ? '/uploads/' + req.file.filename : '';
    db.run("INSERT INTO rooms (name, price, capacity, image_url) VALUES (?, ?, ?, ?)", [name, price, capacity, imageUrl], (err) => {
        res.json({ success: !err });
    });
});

app.put('/api/rooms/:id', (req, res) => {
    const { name, price, capacity } = req.body;
    db.run("UPDATE rooms SET name = ?, price = ?, capacity = ? WHERE id = ?", [name, price, capacity, req.params.id], (err) => {
        res.json({ success: !err });
    });
});

app.delete('/api/rooms/:id', (req, res) => {
    db.run("DELETE FROM rooms WHERE id = ?", [req.params.id], (err) => {
        res.json({ success: !err });
    });
});

// 3. نظام المنيو
app.get('/api/menu', (req, res) => {
    db.all("SELECT * FROM menu", [], (err, rows) => res.json(rows || []));
});

app.post('/api/menu', upload.single('image'), (req, res) => {
    const { name, price, type } = req.body;
    const imageUrl = req.file ? '/uploads/' + req.file.filename : '';
    db.run("INSERT INTO menu (name, price, type, image_url) VALUES (?, ?, ?, ?)", [name, price, type, imageUrl], (err) => {
        res.json({ success: !err });
    });
});

app.put('/api/menu/:id', (req, res) => {
    const { name, price } = req.body;
    db.run("UPDATE menu SET name = ?, price = ? WHERE id = ?", [name, price, req.params.id], (err) => {
        res.json({ success: !err });
    });
});

app.delete('/api/menu/:id', (req, res) => {
    db.run("DELETE FROM menu WHERE id = ?", [req.params.id], (err) => {
        res.json({ success: !err });
    });
});

// 4. نظام المرافق
app.get('/api/facilities', (req, res) => {
    db.all("SELECT * FROM facilities", [], (err, rows) => res.json(rows || []));
});

app.post('/api/facilities', upload.single('image'), (req, res) => {
    const { name, hours, price } = req.body;
    const imageUrl = req.file ? '/uploads/' + req.file.filename : '';
    db.run("INSERT INTO facilities (name, hours, price, image_url) VALUES (?, ?, ?, ?)", [name, hours, price, imageUrl], (err) => {
        res.json({ success: !err });
    });
});

app.put('/api/facilities/:id', (req, res) => {
    const { name, hours, price } = req.body;
    db.run("UPDATE facilities SET name = ?, hours = ?, price = ? WHERE id = ?", [name, hours, price, req.params.id], (err) => {
        res.json({ success: !err });
    });
});

app.delete('/api/facilities/:id', (req, res) => {
    db.run("DELETE FROM facilities WHERE id = ?", [req.params.id], (err) => {
        res.json({ success: !err });
    });
});

// 5. نظام العروض
app.get('/api/offers', (req, res) => {
    db.all("SELECT * FROM offers", [], (err, rows) => res.json(rows || []));
});

app.post('/api/offers', upload.single('image'), (req, res) => {
    const { title, details, price, start_date, end_date } = req.body;
    const imageUrl = req.file ? '/uploads/' + req.file.filename : '';
    db.run("INSERT INTO offers (title, details, price, start_date, end_date, image_url) VALUES (?, ?, ?, ?, ?, ?)", 
    [title, details, price, start_date, end_date, imageUrl], (err) => {
        res.json({ success: !err });
    });
});

app.delete('/api/offers/:id', (req, res) => {
    db.run("DELETE FROM offers WHERE id = ?", [req.params.id], (err) => {
        res.json({ success: !err });
    });
});

// 6. نظام الدفع
app.post('/api/pay', (req, res) => {
    const { userId, userName, itemName, amount } = req.body;
    db.run("INSERT INTO payments (user_id, user_name, item_name, amount) VALUES (?, ?, ?, ?)", 
    [userId, userName, itemName, amount], (err) => {
        res.json({ success: !err });
    });
});

app.get('/api/admin/payments', (req, res) => {
    db.all("SELECT * FROM payments", [], (err, rows) => res.json(rows || []));
});

app.get('/api/user/total/:userId', (req, res) => {
    db.get("SELECT SUM(amount) as total FROM payments WHERE user_id = ?", [req.params.userId], (err, row) => {
        res.json({ total: row ? row.total : 0 });
    });
});

// 7. نظام الإعدادات والتواصل
app.get('/api/settings', (req, res) => {
    db.all("SELECT * FROM settings", [], (err, rows) => res.json(rows || []));
});

app.post('/api/update-setting', (req, res) => {
    const { key, value } = req.body;
    db.run("UPDATE settings SET value = ? WHERE key = ?", [value, key], (err) => {
        res.json({ success: !err });
    });
});

app.get('/api/bg-image', (req, res) => {
    db.get("SELECT value FROM settings WHERE key='bg_url'", (err, row) => {
        res.json({ url: row ? row.value : '' });
    });
});

app.post('/api/bg-image', (req, res) => {
    const { url } = req.body;
    db.run("UPDATE settings SET value = ? WHERE key = 'bg_url'", [url], (err) => {
        res.json({ success: !err });
    });
});

app.get('/api/wifi', (req, res) => {
    db.get("SELECT * FROM wifi WHERE id = 1", [], (err, row) => res.json(row || { name: '', pass: '' }));
});

app.post('/api/wifi', (req, res) => {
    const { name, pass } = req.body;
    db.run("UPDATE wifi SET name = ?, pass = ? WHERE id = 1", [name, pass], (err) => {
        res.json({ success: !err });
    });
});

app.get('/api/waiters', (req, res) => {
    db.all("SELECT * FROM waiters", [], (err, rows) => res.json(rows || []));
});

app.post('/api/waiters', (req, res) => {
    const { name, phone, gender } = req.body;
    db.run("INSERT INTO waiters (name, phone, gender) VALUES (?, ?, ?)", [name, phone, gender], (err) => {
        res.json({ success: !err });
    });
});

app.put('/api/waiters/:id', (req, res) => {
    const { name, phone, gender } = req.body;
    db.run("UPDATE waiters SET name = ?, phone = ?, gender = ? WHERE id = ?", [name, phone, gender, req.params.id], (err) => {
        res.json({ success: !err });
    });
});

app.delete('/api/waiters/:id', (req, res) => {
    db.run("DELETE FROM waiters WHERE id = ?", [req.params.id], (err) => {
        res.json({ success: !err });
    });
});

app.get('/api/map', (req, res) => {
    db.get("SELECT value FROM settings WHERE key='map_url'", (err, row) => {
        res.json({ url: row ? row.value : '' });
    });
});

app.post('/api/map', (req, res) => {
    const { url } = req.body;
    db.run("UPDATE settings SET value = ? WHERE key = 'map_url'", [url], (err) => {
        res.json({ success: !err });
    });
});

// 8. نظام المالك
app.post('/api/admin-verify', (req, res) => {
    db.get("SELECT password FROM users WHERE is_admin = 1", [], async (err, row) => {
        if (!row) return res.json({ success: false });
        const match = await bcrypt.compare(req.body.password, row.password);
        res.json({ success: match });
    });
});

app.post('/api/change-password', (req, res) => {
    const { oldPass, newPass } = req.body;
    db.get("SELECT password FROM users WHERE is_admin = 1", [], async (err, row) => {
        if (row && await bcrypt.compare(oldPass, row.password)) {
            const newHash = await bcrypt.hash(newPass, 10);
            db.run("UPDATE users SET password = ? WHERE is_admin = 1", [newHash], (err) => {
                res.json({ success: !err });
            });
        } else {
            res.json({ success: false });
        }
    });
});

// ربط تشغيل السيرفر بالمنفذ الديناميكي لـ Render أو المنفذ المحلي 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));