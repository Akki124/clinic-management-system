@echo off
echo ========================================================
echo Pushing Clinic Management System to GitHub (Akki124)
echo ========================================================
git branch -M master
git push -u origin master
if %errorlevel% neq 0 (
    echo.
    echo ----------------------------------------------------
    echo If the repository does not exist on GitHub yet:
    echo 1. Go to https://github.com/new
    echo 2. Set Repository name to: clinic-management-system
    echo 3. Keep it Public or Private and click "Create repository"
    echo 4. Then run this script again!
    echo ----------------------------------------------------
)
pause
