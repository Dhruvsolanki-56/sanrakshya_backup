# Complete Setup Guide for Sanrakshya Project

This guide will walk you through setting up the complete Sanrakshya project, including PostgreSQL installation, backend setup, database restoration, and mobile app configuration.

---

## 📋 Prerequisites Check

Before starting, make sure you have:
- [ ] Windows PC with administrator access
- [ ] Stable internet connection
- [ ] At least 5 GB free disk space

---

## Part 1: Install PostgreSQL Database

### Step 1.1: Download PostgreSQL

1. Open your web browser and go to: **https://www.postgresql.org/download/windows/**
2. Click on **"Download the installer"**
3. Download the **PostgreSQL 16.x** (or latest version) for Windows x86-64
4. The file will be named something like `postgresql-16.x-windows-x64.exe`

### Step 1.2: Install PostgreSQL

1. **Run the installer** (double-click the downloaded file)
2. If Windows asks "Do you want to allow this app to make changes?", click **Yes**
3. Follow the installation wizard:
   - **Installation Directory**: Keep default (`C:\Program Files\PostgreSQL\16`)
   - **Select Components**: Keep all checked (PostgreSQL Server, pgAdmin 4, Stack Builder, Command Line Tools)
   - **Data Directory**: Keep default
   - **Password**: 
     - ⚠️ **IMPORTANT**: Enter a password you'll remember (e.g., `postgres123`)
     - Write it down! You'll need this later
     - Example password: `postgres123`
   - **Port**: Keep default (`5432`)
   - **Locale**: Keep default
4. Click **Next** through the setup wizard
5. Click **Finish** when installation completes

### Step 1.3: Verify PostgreSQL Installation

1. Press `Windows Key + R` to open Run dialog
2. Type `cmd` and press Enter to open Command Prompt
3. Type the following command and press Enter:
   ```cmd
   psql --version
   ```
4. You should see something like `psql (PostgreSQL) 16.x`
5. If you see an error, restart your computer and try again

---

## Part 2: Create Database and User

### Step 2.1: Open pgAdmin

1. Press `Windows Key` and search for **"pgAdmin 4"**
2. Click to open pgAdmin 4
3. It will open in your web browser
4. You'll be asked for a **master password** - enter the password you set during installation

### Step 2.2: Create Database

1. In pgAdmin, expand **"Servers"** in the left sidebar
2. If asked for password, enter your PostgreSQL password
3. Right-click on **"Databases"**
4. Select **Create → Database**
5. In the dialog:
   - **Database name**: `sanrakshya`
   - **Owner**: `postgres`
6. Click **Save**

---

## Part 3: Restore Database from Backup

### Step 3.1: Locate the Backup File

The backup file is already in your project at:
```
C:\Users\solan\OneDrive\Desktop\sanrakshya-main\backend\sanrakshya1.sql
```

### Step 3.2: Restore Using pgAdmin (Easiest Method)

1. In pgAdmin, find your newly created **"sanrakshya"** database
2. Right-click on **"sanrakshya"** database
3. Select **"Restore..."**
4. In the Restore dialog:
   - **Format**: Select **"Custom or tar"**
   - **Filename**: Click the folder icon and browse to:
     ```
     C:\Users\solan\OneDrive\Desktop\sanrakshya-main\backend\sanrakshya1.sql
     ```
   - Click **Select**
5. Go to **"Restore options"** tab (if available)
6. Click **"Restore"** button at the bottom
7. Wait for the restore to complete (you'll see a success message)

### Step 3.3: Alternative - Restore Using Command Line

If pgAdmin restore doesn't work, try this:

1. Open Command Prompt (`Windows Key + R`, type `cmd`, press Enter)
2. Run this command (replace the password if you used a different one):
   ```cmd
   set PGPASSWORD=postgres123
   cd "C:\Program Files\PostgreSQL\16\bin"
   pg_restore -U postgres -d sanrakshya "C:\Users\solan\OneDrive\Desktop\sanrakshya-main\backend\sanrakshya1.sql"
   ```

---

## Part 4: Set Up Backend (FastAPI)

### Step 4.1: Check Python Installation

1. Open Command Prompt
2. Type:
   ```cmd
   python --version
   ```
3. You should see `Python 3.10` or higher
4. If not installed, download from: **https://www.python.org/downloads/**
   - During installation, **CHECK** the box "Add Python to PATH"

### Step 4.2: Navigate to Backend Folder

1. Open Command Prompt
2. Type:
   ```cmd
   cd C:\Users\solan\OneDrive\Desktop\sanrakshya-main\backend
   ```

### Step 4.3: Create Virtual Environment

```cmd
python -m venv .venv
```

Wait for it to complete (takes 30-60 seconds).

### Step 4.4: Activate Virtual Environment

```cmd
.venv\Scripts\activate
```

You should see `(.venv)` appear at the beginning of your command line.

### Step 4.5: Install Dependencies

```cmd
python -m pip install --upgrade pip
pip install -r requirements.txt
```

This will take 2-5 minutes. Wait for it to complete.

### Step 4.6: Create Environment Configuration File

1. In the backend folder, create a new file called `.env`
2. You can do this from Command Prompt:
   ```cmd
   type nul > .env
   notepad .env
   ```
3. In Notepad, paste the following (update the PASSWORD if you used a different one):

```env
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/sanrakshya
SECRET_KEY=your-super-secret-key-change-this-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REPORTS_MASTER_KEY=your-reports-master-key-change-this
```

4. Save and close Notepad

> **IMPORTANT**: Replace `postgres123` with your actual PostgreSQL password if different.

### Step 4.7: Run Database Migrations

```cmd
alembic upgrade head
```

---

## Part 5: Set Up Mobile App (Expo/React Native)

### Step 5.1: Check Node.js Installation

1. Open a **NEW** Command Prompt window
2. Type:
   ```cmd
   node --version
   npm --version
   ```
3. You should see version numbers (Node 18+ recommended)
4. If not installed, download from: **https://nodejs.org/** (download LTS version)

### Step 5.2: Navigate to Mobile Folder

```cmd
cd C:\Users\solan\OneDrive\Desktop\sanrakshya-main\mobile
```

### Step 5.3: Install Dependencies

```cmd
npm install
```

This will take 3-5 minutes. Be patient!

---

## Part 6: Run the Applications

### Step 6.1: Start the Backend Server

1. Open Command Prompt (or use the one from Part 4)
2. Navigate to backend and activate venv:
   ```cmd
   cd C:\Users\solan\OneDrive\Desktop\sanrakshya-main\backend
   .venv\Scripts\activate
   ```
3. Start the server:
   ```cmd
   python run.py
   ```
   OR use the provided script:
   ```cmd
   start.bat
   ```

4. **IMPORTANT**: Look for output like:
   ```
   🚀 FastAPI running at: http://192.168.x.x:8000
   ```
   **Write down this IP address!** You'll need it for the mobile app.

5. Test it by opening your browser and going to:
   ```
   http://localhost:8000
   ```
   You should see: `{"status":"ok"}`

### Step 6.2: Configure Mobile App

1. Open a **NEW** Command Prompt window
2. Navigate to mobile folder:
   ```cmd
   cd C:\Users\solan\OneDrive\Desktop\sanrakshya-main\mobile
   ```
3. Open the config file:
   ```cmd
   notepad config.js
   ```
4. Update the API URL with the IP address you got from Step 6.1
   - For example, if backend showed `http://192.168.1.100:8000`, use that
5. Save and close

### Step 6.3: Start the Mobile App

In the same Command Prompt (in mobile folder):

```cmd
npm start
```

OR for specific platforms:
```cmd
npm run android    # For Android emulator/device
npm run web        # For web browser
```

You'll see a QR code and options to open on different platforms.

---

## 🧪 Verify Everything Works

### Backend Health Check

1. Open browser to: `http://localhost:8000`
2. Should see: `{"status":"ok"}`
3. Try API docs: `http://localhost:8000/docs`

### Mobile App Connection

1. Make sure both PC and phone are on the **same WiFi network**
2. Use Expo Go app on your phone to scan the QR code
3. OR use Android emulator if you have Android Studio installed

---

## ❗ Common Issues & Solutions

### Issue: "PostgreSQL not found" error
**Solution**: 
- Restart your computer
- Add PostgreSQL to PATH manually:
  1. Search "Environment Variables" in Windows
  2. Add `C:\Program Files\PostgreSQL\16\bin` to PATH

### Issue: Mobile app can't connect to backend
**Solution**:
- Make sure both are on same WiFi
- Use the **LAN IP address** (like 192.168.x.x), NOT localhost
- Check Windows Firewall - allow Python through
- Update `config.js` with correct IP

### Issue: "pip install" fails
**Solution**:
- Make sure virtual environment is activated (you see `.venv` in prompt)
- Try: `python -m pip install --upgrade pip`
- Then retry: `pip install -r requirements.txt`

### Issue: Database restore fails
**Solution**:
- Make sure you created the database first
- Try the command-line method (Step 3.3)
- Check PostgreSQL password is correct

---

## 📱 Next Steps

Once everything is running:

1. **Backend** runs at: `http://YOUR-IP:8000`
2. **API Documentation** at: `http://YOUR-IP:8000/docs`
3. **Mobile App** connects to backend using the IP you configured

---

## 🎯 Quick Start Commands (After Initial Setup)

### To Start Backend:
```cmd
cd C:\Users\solan\OneDrive\Desktop\sanrakshya-main\backend
.venv\Scripts\activate
python run.py
```

### To Start Mobile:
```cmd
cd C:\Users\solan\OneDrive\Desktop\sanrakshya-main\mobile
npm start
```

---

## 🆘 Need Help?

If you encounter issues:
1. Check the error message carefully
2. Make sure all prerequisites are installed
3. Try restarting your computer
4. Check firewall settings
5. Ensure correct passwords and IP addresses

Good luck! 🚀
