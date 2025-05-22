@echo off
echo Cleaning up documentation files...

cd /d "G:\Documents\AA ITB\find-project"

:: Delete from main directory
del "ADVANCED_ALERTS.md" 2>nul
del "ADVANCED_ALERTS_DEPENDENCIES.md" 2>nul
del "ALERTS_ENHANCEMENT_SUMMARY.md" 2>nul
del "CHANGES.md" 2>nul
del "ENHANCEMENTS_SUMMARY.md" 2>nul
del "MARK_TRACKER_LOST.md" 2>nul
del "SCHEDULED_ALERT_TIMEZONE_FIX.md" 2>nul
del "VISUAL_ENHANCEMENT_GUIDE.md" 2>nul
del "VISUAL_IMPLEMENTATION_GUIDE.md" 2>nul

:: Delete from admin-portal directory
cd "admin-portal"
del "ADDRESS_ENHANCEMENT.md" 2>nul
del "IMPLEMENTATION_SUMMARY.md" 2>nul
del "SAMPLE_DATA_GUIDE.md" 2>nul
del "ENHANCEMENTS.md" 2>nul
del "SUMMARY.md" 2>nul

echo Cleanup complete!
echo.
echo Kept these important files:
echo - README.md (main)
echo - SETUP_GUIDE.md
echo - admin-portal/README.md
echo.
pause