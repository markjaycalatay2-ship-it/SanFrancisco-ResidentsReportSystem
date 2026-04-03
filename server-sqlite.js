const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const { db, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, addDoc } = require('./firebase-config');

const app = express();
const PORT = process.env.PORT || 3000;

// Check if running on Vercel
const isVercel = process.env.VERCEL === '1';

// Initialize default admin on startup
async function initializeDefaultAdmin() {
    try {
        const adminRef = doc(db, 'users', 'admin');
        const adminSnap = await getDoc(adminRef);
        if (!adminSnap.exists()) {
            await setDoc(adminRef, {
                id: 1,
                full_name: 'Administrator',
                age: 35,
                gender: 'Other',
                username: 'admin',
                password: bcrypt.hashSync('admin123', 10),
                contact_number: '123-456-7890',
                address: 'Barangay Hall',
                role: 'admin',
                status: 'approved',
                last_login: null,
                created_at: new Date().toISOString()
            });
            console.log('Default admin created');
        }
    } catch (error) {
        console.error('Error creating default admin:', error);
    }
}

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'barangay-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000,
        secure: isVercel
    }
}));

// Initialize default admin
initializeDefaultAdmin();

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Middleware to check if user is admin
function isAdmin(req, res, next) {
    if (req.session.role === 'admin') {
        next();
    } else {
        res.redirect('/resident-dashboard');
    }
}

// Routes
app.get('/', (req, res) => {
    if (req.session.userId) {
        if (req.session.role === 'admin') {
            res.redirect('/admin-dashboard');
        } else {
            res.redirect('/resident-dashboard');
        }
    } else {
        res.sendFile(__dirname + '/public/login.html');
    }
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
        
        const userDoc = querySnapshot.docs[0];
        const user = userDoc.data();
        
        bcrypt.compare(password, user.password, async (err, result) => {
            if (result) {
                if (user.status === 'pending') {
                    return res.status(403).json({ success: false, message: 'Your account is pending admin approval.' });
                } else if (user.status === 'rejected') {
                    return res.status(403).json({ success: false, message: 'Your registration has been rejected.' });
                }
                
                req.session.userId = user.id;
                req.session.username = user.username;
                req.session.fullName = user.full_name;
                req.session.role = user.role;
                
                // Update last login
                await updateDoc(doc(db, 'users', userDoc.id), {
                    last_login: new Date().toISOString()
                });
                
                // Log login activity
                await addDoc(collection(db, 'logs'), {
                    user_id: user.id,
                    action: 'Login',
                    timestamp: new Date().toISOString()
                });
                
                res.json({ success: true, role: user.role });
            } else {
                res.status(401).json({ success: false, message: 'Invalid username or password' });
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

app.post('/register', async (req, res) => {
    const { full_name, age, gender, username, password, contact_number, address } = req.body;
    
    try {
        // Check if username exists
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }
        
        const hashedPassword = bcrypt.hashSync(password, 10);
        const newUserRef = doc(usersRef);
        const newId = newUserRef.id;
        
        await setDoc(newUserRef, {
            id: newId,
            full_name,
            age: parseInt(age),
            gender,
            username,
            password: hashedPassword,
            contact_number,
            address,
            role: 'resident',
            status: 'pending',
            last_login: null,
            created_at: new Date().toISOString()
        });
        
        // Log registration
        await addDoc(collection(db, 'logs'), {
            user_id: newId,
            action: 'Registration - Pending Approval',
            timestamp: new Date().toISOString()
        });
        
        res.json({ success: true, message: 'Registration successful! Your account is pending admin approval.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

app.get('/admin-dashboard', isAuthenticated, isAdmin, (req, res) => {
    res.sendFile(__dirname + '/public/admin-dashboard.html');
});

app.get('/resident-dashboard', isAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/public/resident-dashboard.html');
});

app.get('/new-report', isAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/public/new-report.html');
});

app.get('/my-reports', isAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/public/my-reports.html');
});

app.get('/manage-reports', isAuthenticated, isAdmin, (req, res) => {
    res.sendFile(__dirname + '/public/manage-reports.html');
});

app.get('/resident-directory', isAuthenticated, isAdmin, (req, res) => {
    res.sendFile(__dirname + '/public/resident-directory.html');
});

app.get('/transaction-history', isAuthenticated, isAdmin, (req, res) => {
    res.sendFile(__dirname + '/public/transaction-history.html');
});

app.get('/user-approval', isAuthenticated, isAdmin, (req, res) => {
    res.sendFile(__dirname + '/public/user-approval.html');
});

// API Routes
app.get('/api/user-info', isAuthenticated, (req, res) => {
    res.json({
        userId: req.session.userId,
        username: req.session.username,
        fullName: req.session.fullName,
        role: req.session.role
    });
});

app.post('/api/reports', isAuthenticated, async (req, res) => {
    const { description, date_time, location, involved_persons, cause } = req.body;
    
    try {
        const newReportRef = doc(collection(db, 'reports'));
        await setDoc(newReportRef, {
            id: newReportRef.id,
            user_id: req.session.userId,
            description,
            date_time,
            location,
            involved_persons: involved_persons || '',
            cause: cause || '',
            status: 'pending',
            created_at: new Date().toISOString()
        });
        
        await addDoc(collection(db, 'logs'), {
            user_id: req.session.userId,
            action: 'Created report',
            timestamp: new Date().toISOString()
        });
        
        res.json({ success: true, message: 'Report created successfully' });
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ success: false, message: 'Failed to create report' });
    }
});

app.get('/api/reports', isAuthenticated, async (req, res) => {
    try {
        const reportsSnapshot = await getDocs(collection(db, 'reports'));
        const usersSnapshot = await getDocs(collection(db, 'users'));
        
        const usersMap = {};
        usersSnapshot.docs.forEach(doc => {
            usersMap[doc.id] = doc.data();
        });
        
        let reports = reportsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        if (req.session.role === 'admin') {
            reports = reports.map(r => ({
                ...r,
                resident_name: usersMap[r.user_id]?.full_name || 'Unknown',
                username: usersMap[r.user_id]?.username || 'Unknown'
            }));
        } else {
            reports = reports
                .filter(r => usersMap[r.user_id]?.status === 'approved')
                .map(r => ({
                    ...r,
                    resident_name: usersMap[r.user_id]?.full_name || 'Unknown'
                }));
        }
        
        res.json(reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reports' });
    }
});

// API endpoint for user's own reports only
app.get('/api/my-reports', isAuthenticated, async (req, res) => {
    try {
        const reportsSnapshot = await getDocs(collection(db, 'reports'));
        const userReports = reportsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(r => r.user_id === req.session.userId)
            .map(r => ({ ...r, username: req.session.username }));
        
        res.json(userReports);
    } catch (error) {
        console.error('Error fetching user reports:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch your reports' });
    }
});

app.put('/api/reports/:id', isAuthenticated, async (req, res) => {
    const reportId = req.params.id;
    const { description, date_time, location, involved_persons, cause } = req.body;
    
    try {
        const reportRef = doc(db, 'reports', reportId);
        const reportSnap = await getDoc(reportRef);
        
        if (!reportSnap.exists()) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }
        
        const report = reportSnap.data();
        if (req.session.role !== 'admin' && report.user_id !== req.session.userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        
        await updateDoc(reportRef, {
            description,
            date_time,
            location,
            involved_persons,
            cause
        });
        
        await addDoc(collection(db, 'logs'), {
            user_id: req.session.userId,
            action: `Updated report ${reportId}`,
            timestamp: new Date().toISOString()
        });
        
        res.json({ success: true, message: 'Report updated successfully' });
    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ success: false, message: 'Failed to update report' });
    }
});

app.put('/api/reports/:id/status', isAuthenticated, isAdmin, async (req, res) => {
    const { status } = req.body;
    const reportId = req.params.id;
    
    try {
        const reportRef = doc(db, 'reports', reportId);
        const reportSnap = await getDoc(reportRef);
        
        if (!reportSnap.exists()) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }
        
        await updateDoc(reportRef, { status });
        
        await addDoc(collection(db, 'logs'), {
            user_id: req.session.userId,
            action: `Updated report ${reportId} status to ${status}`,
            timestamp: new Date().toISOString()
        });
        
        res.json({ success: true, message: 'Report updated successfully' });
    } catch (error) {
        console.error('Error updating report status:', error);
        res.status(500).json({ success: false, message: 'Failed to update report' });
    }
});

app.delete('/api/reports/:id', isAuthenticated, async (req, res) => {
    const reportId = req.params.id;
    
    try {
        const reportRef = doc(db, 'reports', reportId);
        const reportSnap = await getDoc(reportRef);
        
        if (!reportSnap.exists()) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }
        
        const report = reportSnap.data();
        if (req.session.role !== 'admin' && report.user_id !== req.session.userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        
        await deleteDoc(reportRef);
        
        await addDoc(collection(db, 'logs'), {
            user_id: req.session.userId,
            action: `Deleted report ${reportId}`,
            timestamp: new Date().toISOString()
        });
        
        res.json({ success: true, message: 'Report deleted successfully' });
    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({ success: false, message: 'Failed to delete report' });
    }
});

app.get('/api/residents', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const residents = usersSnapshot.docs
            .map(doc => doc.data())
            .filter(u => u.role === 'resident' && u.status === 'approved')
            .map(u => ({
                id: u.id,
                full_name: u.full_name,
                age: u.age,
                gender: u.gender,
                username: u.username,
                last_login: u.last_login,
                contact_number: u.contact_number,
                address: u.address
            }));
        res.json(residents);
    } catch (error) {
        console.error('Error fetching residents:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch residents' });
    }
});

app.get('/api/logs', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const logsSnapshot = await getDocs(collection(db, 'logs'));
        const usersSnapshot = await getDocs(collection(db, 'users'));
        
        const usersMap = {};
        usersSnapshot.docs.forEach(doc => {
            usersMap[doc.id] = doc.data();
        });
        
        const logsWithUsers = logsSnapshot.docs
            .map(doc => doc.data())
            .map(l => ({
                ...l,
                full_name: usersMap[l.user_id]?.full_name || 'Unknown',
                username: usersMap[l.user_id]?.username || 'Unknown'
            }))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        res.json(logsWithUsers);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch logs' });
    }
});

app.get('/api/statistics', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const reportsSnapshot = await getDocs(collection(db, 'reports'));
        const reports = reportsSnapshot.docs.map(doc => doc.data());
        
        const stats = {
            total_reports: reports.length,
            pending_reports: reports.filter(r => r.status === 'pending').length,
            ongoing_reports: reports.filter(r => r.status === 'ongoing').length,
            resolved_reports: reports.filter(r => r.status === 'resolved').length
        };
        res.json(stats);
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
    }
});

// User Approval API endpoints
app.get('/api/pending-users', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const pendingUsers = usersSnapshot.docs
            .map(doc => doc.data())
            .filter(u => u.status === 'pending' && u.role !== 'admin')
            .map(u => ({
                id: u.id,
                full_name: u.full_name,
                age: u.age,
                gender: u.gender,
                username: u.username,
                contact_number: u.contact_number,
                address: u.address,
                created_at: u.created_at
            }));
        res.json(pendingUsers);
    } catch (error) {
        console.error('Error fetching pending users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch pending users' });
    }
});

// Get all users for statistics
app.get('/api/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const allUsers = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: data.id,
                full_name: data.full_name,
                username: data.username,
                role: data.role,
                status: data.status
            };
        });
        res.json(allUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

app.put('/api/users/:id/approve', isAuthenticated, isAdmin, async (req, res) => {
    const userId = req.params.id;
    
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { status: 'approved' });
        
        await addDoc(collection(db, 'logs'), {
            user_id: req.session.userId,
            action: `Approved user ${userId}`,
            timestamp: new Date().toISOString()
        });
        
        res.json({ success: true, message: 'User approved successfully' });
    } catch (error) {
        console.error('Error approving user:', error);
        res.status(500).json({ success: false, message: 'Failed to approve user' });
    }
});

app.put('/api/users/:id/reject', isAuthenticated, isAdmin, async (req, res) => {
    const userId = req.params.id;
    
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { status: 'rejected' });
        
        await addDoc(collection(db, 'logs'), {
            user_id: req.session.userId,
            action: `Rejected user ${userId}`,
            timestamp: new Date().toISOString()
        });
        
        res.json({ success: true, message: 'User rejected successfully' });
    } catch (error) {
        console.error('Error rejecting user:', error);
        res.status(500).json({ success: false, message: 'Failed to reject user' });
    }
});

app.delete('/api/users/:id', isAuthenticated, isAdmin, async (req, res) => {
    const userId = req.params.id;
    
    try {
        // Delete user's reports
        const reportsSnapshot = await getDocs(collection(db, 'reports'));
        for (const reportDoc of reportsSnapshot.docs) {
            if (reportDoc.data().user_id === userId) {
                await deleteDoc(doc(db, 'reports', reportDoc.id));
            }
        }
        
        // Delete user's logs
        const logsSnapshot = await getDocs(collection(db, 'logs'));
        for (const logDoc of logsSnapshot.docs) {
            if (logDoc.data().user_id === userId) {
                await deleteDoc(doc(db, 'logs', logDoc.id));
            }
        }
        
        // Delete user
        await deleteDoc(doc(db, 'users', userId));
        
        await addDoc(collection(db, 'logs'), {
            user_id: req.session.userId,
            action: `Deleted user ${userId}`,
            timestamp: new Date().toISOString()
        });
        
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
});

app.post('/logout', async (req, res) => {
    if (req.session.userId) {
        try {
            await addDoc(collection(db, 'logs'), {
                user_id: req.session.userId,
                action: 'Logout',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error logging logout:', error);
        }
    }
    
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ success: false, message: 'Logout failed' });
        } else {
            res.json({ success: true, message: 'Logged out successfully' });
        }
    });
});

// Start server (only if not on Vercel)
if (!isVercel) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log('📊 Database: Firebase Firestore (Cloud)');
        console.log('👤 Default admin: username=admin, password=admin123');
        console.log('\n🌐 Open your browser and navigate to: http://localhost:3000');
    });
}

// Export for Vercel serverless functions
module.exports = app;
