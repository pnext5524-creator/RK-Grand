@echo off
echo Deploying to GitHub Pages...

git add .
git commit -m "Update GitHub Pages deployment - %date% %time%"
git push origin main

echo.
echo Deployment pushed to GitHub!
echo Check your GitHub repository Actions tab for deployment status.
echo Site should be available at: https://pnext5524-creator.github.io/RK-Grand/
echo.
pause