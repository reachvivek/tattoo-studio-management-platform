@echo off
echo Creating database schema...
psql -U postgres -d bizkit_db -f schemas\database.sql
echo Done!
pause
