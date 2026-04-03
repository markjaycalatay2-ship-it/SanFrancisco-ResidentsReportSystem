# Barangay Complaint and Incident Report Monitoring System

A full-stack web application for Barangay San Francisco to allow residents to report incidents and complaints, and for barangay personnel to manage and monitor them.

## Features

### For Residents
- **Registration System**: Create account with personal information
- **Login System**: Secure authentication
- **Dashboard**: View personal statistics and recent reports
- **Submit Reports**: Create detailed incident/complaint reports
- **Manage Reports**: View, edit, and delete own reports
- **Track Status**: Monitor report status (Pending, Ongoing, Resolved)

### For Admin (Barangay Personnel)
- **Admin Dashboard**: Overview of all reports and statistics
- **Manage Reports**: View all reports, update status, delete reports
- **Resident Directory**: View all registered residents
- **Transaction History**: Monitor system activities and logs
- **Search & Filter**: Advanced filtering for reports and logs

## Tech Stack

- **Backend**: Node.js with Express.js
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Database**: MySQL 5.7+
- **Authentication**: Session-based with bcrypt
- **UI**: Responsive design with modern CSS

## Installation & Setup

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node Package Manager)
- MySQL Server (version 5.7 or higher)

### Step 1: Install MySQL Server
Make sure MySQL is installed and running on your system:

**Windows (XAMPP/WAMP):**
- Download and install XAMPP or WAMP
- Start MySQL from the control panel
- Default credentials: username='root', password=''

**macOS (MAMP/Homebrew):**
- Install MAMP or use Homebrew: `brew install mysql`
- Start MySQL service
- Note your MySQL credentials

**Linux:**
- Install MySQL: `sudo apt-get install mysql-server`
- Start service: `sudo systemctl start mysql`
- Secure installation: `sudo mysql_secure_installation`

### Step 2: Configure Database
1. Open the `db-config.js` file
2. Update the MySQL credentials:
   ```javascript
   module.exports = {
       host: 'localhost',
       user: 'your_mysql_username',    // Usually 'root'
       password: 'your_mysql_password', // Your MySQL password
       database: 'barangay_system',
       charset: 'utf8mb4'
   };
   ```

### Step 3: Install Node Dependencies
```bash
npm install
```

### Step 4: Start the Application
```bash
# For development
npm run dev

# For production
npm start
```

The application will:
- Automatically create the `barangay_system` database
- Create all necessary tables
- Create the default admin user
- Start on `http://localhost:3000`

### Step 5: Access the System
- **Default Admin Account**:
  - Username: `admin`
  - Password: `admin123`

- **Resident Registration**: New users can register through the registration page

## Database Structure

The system uses MySQL with the following tables:

### Users Table
- `id` - Primary key
- `full_name` - Resident's full name
- `age` - Age
- `gender` - Gender
- `username` - Unique username
- `password` - Hashed password
- `contact_number` - Contact information
- `address` - Address/Purok
- `role` - User role (resident/admin)
- `last_login` - Last login timestamp
- `created_at` - Account creation timestamp

### Reports Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `description` - Incident description
- `date_time` - When incident occurred
- `location` - Location of incident
- `involved_persons` - People involved
- `cause` - Possible cause
- `status` - Report status (pending/ongoing/resolved)
- `created_at` - Report creation timestamp

### Logs Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `action` - Action performed
- `timestamp` - When action occurred

## File Structure

```
barangay-complaint-system/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── db-config.js           # MySQL database configuration
├── public/               # Frontend files
│   ├── style.css         # Global styles
│   ├── login.html        # Login page
│   ├── register.html     # Registration page
│   ├── resident-dashboard.html    # Resident dashboard
│   ├── new-report.html   # Submit new report
│   ├── my-reports.html   # View resident's reports
│   ├── admin-dashboard.html       # Admin dashboard
│   ├── manage-reports.html        # Manage all reports
│   ├── resident-directory.html    # View residents
│   └── transaction-history.html   # System logs
└── README.md             # This file
```

## API Endpoints

### Authentication
- `POST /login` - User login
- `POST /register` - User registration
- `POST /logout` - User logout

### User Info
- `GET /api/user-info` - Get current user information

### Reports
- `GET /api/reports` - Get reports (user's own or all for admin)
- `POST /api/reports` - Create new report
- `PUT /api/reports/:id` - Update report details
- `PUT /api/reports/:id/status` - Update report status (admin only)
- `DELETE /api/reports/:id` - Delete report

### Admin Only
- `GET /api/residents` - Get all residents
- `GET /api/logs` - Get system logs
- `GET /api/statistics` - Get dashboard statistics

## Usage Instructions

### For Residents
1. **Register**: Create an account with your personal information
2. **Login**: Use your credentials to access the system
3. **Submit Report**: Fill out the incident report form with detailed information
4. **Track Reports**: View your submitted reports and their current status
5. **Edit/Delete**: Modify or remove your own reports as needed

### For Admin
1. **Login**: Use admin credentials (default: admin/admin123)
2. **Monitor Dashboard**: View overall statistics and recent activities
3. **Manage Reports**: Update report statuses, review submissions
4. **View Residents**: Access the resident directory
5. **Monitor Activity**: Check transaction history for system activities

## Security Features

- Password hashing with bcrypt
- Session-based authentication
- Role-based access control
- Input validation and sanitization
- SQL injection prevention with parameterized queries

## Customization

### Changing Default Admin Credentials
Edit the `server.js` file in the `initializeDatabase()` function:

```javascript
const hashedPassword = bcrypt.hashSync('newPassword', 10);
db.run(`INSERT OR IGNORE INTO users 
    (full_name, age, gender, username, password, contact_number, address, role) 
    VALUES ('Administrator', 35, 'Other', 'admin', ?, '123-456-7890', 'Barangay Hall', 'admin')`, 
    [hashedPassword]);
```

### Modifying UI Colors
Edit the `public/style.css` file to customize the color scheme:

```css
.header {
    background-color: #your-color;
}

.sidebar {
    background-color: #your-color;
}
```

## Troubleshooting

### Common Issues

1. **MySQL Connection Error**
   - Ensure MySQL server is running
   - Check credentials in `db-config.js`
   - Verify MySQL user has necessary privileges
   - Common credentials:
     - XAMPP/WAMP: username='root', password=''
     - MAMP: username='root', password='root'

2. **Database Creation Failed**
   - Make sure MySQL user has CREATE DATABASE privileges
   - Check if database name conflicts with existing databases
   - Try manually creating the database:
     ```sql
     CREATE DATABASE barangay_system;
     ```

3. **Port Already in Use**
   - Change the port in `server.js`:
   ```javascript
   const PORT = process.env.PORT || 3001; // Use 3001 instead of 3000
   ```

4. **Session Issues**
   - Clear browser cookies and cache
   - Restart the server

5. **Permission Issues**
   - Ensure MySQL user has full privileges on the database:
     ```sql
     GRANT ALL PRIVILEGES ON barangay_system.* TO 'your_user'@'localhost';
     FLUSH PRIVILEGES;
     ```

## Support

For issues or questions about the system, please contact the system administrator or check the console logs for error messages.

## License

This project is licensed under the MIT License.

---

**Note**: This system is designed for Barangay San Francisco but can be adapted for other barangays or local government units with minimal modifications.
#   b a r a n g a y - s a n f r a n c i s c o - s y s t e m  
 