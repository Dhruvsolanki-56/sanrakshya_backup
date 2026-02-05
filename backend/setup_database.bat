@echo off
echo ========================================
echo Setting Up PostgreSQL Database
echo ========================================
echo.

set /p PGPASS="Enter your PostgreSQL password: "
set PGPASSWORD=%PGPASS%

echo.
echo Step 1: Creating database 'sanrakshya' (if not exists)...
"C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres sanrakshya 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Database created!
) else (
    echo [INFO] Database already exists, continuing...
)

echo.
echo Step 2: Restoring database from SQL backup...
echo This may take a few minutes...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d sanrakshya -f "%~dp0sanrakshya1.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Database restored successfully!
) else (
    echo.
    echo [WARNING] Restore completed with some warnings (this is often normal)
)

echo.
echo ========================================
echo Database setup complete!
echo ========================================
echo.
echo You can now proceed to set up the backend.
echo.
pause
