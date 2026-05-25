# SBT - Rent-to-Own Vehicle Platform

A modern, responsive rent-to-own vehicle platform powered by **Supabase** (replacing PHP backend). Customers can browse available vehicles, apply online, and track applications through an admin dashboard.

## 🚀 Project Status: Migrated to Supabase

✅ **Successfully migrated from PHP to Supabase**
- All backend APIs now use Supabase client-side
- No more PHP files needed
- Real-time database synchronization
- Built-in authentication support
- Automatic backups and security

---

## 📋 Features

### Public Features
- **Homepage** - Marketing landing page with testimonials
- **Vehicle Listing** - Browse, filter, and search vehicles by type
- **Application Form** - Multi-step form for vehicle applications
- **Image Slider** - View multiple vehicle images
- **Success Page** - Confirmation after submission

### Admin Dashboard
- **Login** - Secure authentication via Supabase
- **Dashboard** - View application statistics and status overview
- **Application Management** - View, approve, or reject applications
- **Real-time Updates** - Live status tracking

---

## 🏗️ Project Structure

```
sbt/
├── index.html                    # Homepage
├── vehicles.html                 # Vehicle listing page
├── apply.html                    # Application form page
├── application-success.html      # Confirmation page
├── config/
│   └── database.php              # Supabase configuration
├── admin/
│   ├── login.html                # Admin login
│   ├── dashboard.html            # Admin dashboard
│   └── view-application.html     # View single application
├── assets/
│   ├── css/
│   │   ├── style.css             # Frontend styles
│   │   └── admin.css             # Admin styles
│   └── js/
│       └── main.js               # All JavaScript logic
├── api/                          # Deprecated PHP files (kept for reference)
├── uploads/                      # User document uploads (if needed)
└── database/
    └── schema.sql                # Supabase schema
```

---

## ⚙️ Technology Stack

- **Frontend**: HTML5, Bootstrap 5, JavaScript
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Hosting**: Static hosting compatible (Netlify, GitHub Pages, Vercel)

---

## 🔑 Supabase Configuration

### Project Details
- **URL**: https://jzeezibzydgituzolvrq.supabase.co
- **Publishable Key**: sb_publishable_ppRxdMfJqma6VVwbffUH0A_fBgEIhf4

### Database Tables

#### `vehicles`
Stores all available vehicles

```sql
SELECT * FROM vehicles;
```

**Columns**: id, name, type, engine_capacity, year, fuel_type, transmission, mileage, price, monthly_payment, description, status

#### `vehicle_images`
Multiple images per vehicle

```sql
SELECT * FROM vehicle_images WHERE vehicle_id = ?;
```

**Columns**: id, vehicle_id, image_url, is_primary, created_at

#### `applications`
Applicant information and status

```sql
SELECT * FROM applications WHERE status = 'pending';
```

**Columns**: id, vehicle_id, first_name, surname, national_id, dob, occupation, residential_address, marital_status, gender, religion, contact_number, kin_name, kin_surname, kin_contact, kin_address, status, admin_fee_paid, created_at, updated_at

---

## 🚀 Getting Started

### 1. Set Up Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create an account or log in
3. Go to your project: https://jzeezibzydgituzolvrq.supabase.co
4. Run the SQL from `database/schema.sql` in the SQL editor

### 2. Local Setup

```bash
# Clone the repository
git clone <repo-url>
cd sbt

# Open with local web server (required for CORS)
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js (with http-server)
npx http-server

# Option 3: PHP built-in server
php -S localhost:8000
```

Then visit: http://localhost:8000

### 2. Set Up Supabase Storage

1. Create a storage bucket for vehicle images:
   - Go to Storage in your Supabase dashboard
   - Click "Create bucket"
   - Name: `vehicle-images`
   - Make it public (uncheck "Private")

2. Configure bucket policies (optional for basic access):
   - In the bucket settings, ensure public access is enabled

### 3. Admin Setup

1. Create admin user in Supabase Auth
   - Go to Authentication > Users
   - Add a new user with email and password

2. Login at: http://localhost:8000/admin/login.html
3. Access dashboard: http://localhost:8000/admin/dashboard.html

---

## 📝 Database Queries

### Get All Available Vehicles
```javascript
const { data: vehicles } = await supabase
  .from('vehicles')
  .select('*, vehicle_images(*)')
  .eq('status', 'available');
```

### Submit Application
```javascript
const { error } = await supabase
  .from('applications')
  .insert([{
    vehicle_id: 1,
    first_name: 'John',
    surname: 'Doe',
    national_id: '12345',
    dob: '1990-01-01',
    contact_number: '+1234567890',
    status: 'pending'
  }]);
```

### Get Applications for Admin
```javascript
const { data: apps } = await supabase
  .from('applications')
  .select('*, vehicle:vehicles(name, type)')
  .order('created_at', { ascending: false });
```

### Update Application Status
```javascript
const { error } = await supabase
  .from('applications')
  .update({ status: 'approved' })
  .eq('id', 5);
```

---

## 🔒 Security Notes

### Configuration Security
- Store sensitive credentials in environment variables for production
- Never commit `.env` files with real keys
- Use Supabase Auth for user management

### Row Level Security (RLS)
Current implementation is public for demonstration. For production:

```sql
-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;

-- Only admin can view/edit applications
CREATE POLICY admin_access ON public.applications
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow authenticated admin users to insert vehicle images
CREATE POLICY vehicle_images_insert ON public.vehicle_images
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

If you are using the demo app with anonymous/publishable keys, keep `vehicle_images` RLS disabled or add a policy that allows the session user to write.

---

## 📱 Pages Overview

### Public Pages

#### `/index.html` - Homepage
- Hero section with call-to-action
- How it works guide
- Customer testimonials
- Navigation to vehicles

#### `/vehicles.html` - Vehicle Listing
- Filter by vehicle type
- Search by name
- Image carousel per vehicle
- Apply button per vehicle

#### `/apply.html` - Application Form
- 3-step multi-step form
- Step 1: Personal Information
- Step 2: Next of Kin
- Step 3: Document Upload
- Form validation
- Supabase submission

#### `/application-success.html` - Success Page
- Confirmation message
- Next steps information
- Navigation back to site

### Admin Pages

#### `/admin/login.html` - Login
- Email/password authentication
- Supabase Auth integration
- Redirects to dashboard on success

#### `/admin/dashboard.html` - Dashboard
- Statistics cards (Total, Pending, Approved, Rejected)
- Applications list with status
- Filter by status
- View individual applications

#### `/admin/view-application.html` - Application Detail
- Full applicant information
- Vehicle details
- Next of Kin information
- Approve/Reject buttons
- Status history

---

## 🎨 Styling

### Color Scheme
- **Primary**: `#1a73e8` (Blue)
- **Dark**: `#1a1a2e` (Dark Blue)
- **Light**: `#f8f9fa` (Light Gray)
- **Success**: `#198754` (Green)

### CSS Files
- `assets/css/style.css` - Public pages styling
- `assets/css/admin.css` - Admin dashboard styling

---

## 🛠️ JavaScript Functions

### Main Functions in `assets/js/main.js`

```javascript
// Load and filter vehicles
loadVehicles(filter = 'all', search = '')

// Initialize image sliders
initSliders()

// Form submission
initApplicationForm()

// Admin functions
protectAdminPage()
updateApplicationStatus(appId, status)
loadApplications()
```

---

## 🐛 Troubleshooting

### Issue: CORS Error
**Solution**: Use a local web server (not `file://` protocol)

### Issue: Supabase Connection Failed
**Solution**: Check your project URL and key in `config/database.php`

### Issue: Applications Not Saving
**Solution**: 
1. Check Supabase project is active
2. Verify database tables exist
3. Check browser console for errors

### Issue: Admin Login Not Working
**Solution**:
1. Ensure user exists in Supabase Auth
2. Check email/password credentials
3. Clear browser cookies

---

## 📊 Database Backup & Recovery

### Backup Steps
1. Go to Supabase Dashboard
2. Click "Database" → "Backups"
3. Download backup regularly

### Recovery Steps
1. Go to "Backups"
2. Click "Restore" on desired backup
3. Confirm restoration

---

## 🚀 Deployment

### Option 1: Netlify
```bash
# Build command (none needed)
# Publish directory: ./ (root)

npm run build  # If using build tools
```

### Option 2: Vercel
```bash
vercel --prod
```

### Option 3: GitHub Pages
```bash
git push origin main
# Enable GitHub Pages in repository settings
```

---

## 📞 Support

For issues or questions:
1. Check Supabase documentation: https://supabase.com/docs
2. Review browser console for errors
3. Verify database connection

---

## 📄 License

This project is provided as-is for the SBT rent-to-own platform.

---

## ✅ Migration Checklist

- [x] Remove all PHP dependencies
- [x] Convert admin pages to HTML
- [x] Implement Supabase client-side
- [x] Update database schema for Supabase
- [x] Create admin authentication
- [x] Implement form submission to Supabase
- [x] Add application status management
- [x] Set up real-time updates
- [x] Clean up old API files
- [x] Document setup process

---

**Last Updated**: May 3, 2026  
**Version**: 2.0 (Supabase)
# SBT-
