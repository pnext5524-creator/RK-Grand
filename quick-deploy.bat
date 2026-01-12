@echo off
echo Deploying to GitHub Pages...

git add .
git commit -m "Fix: Update GitHub Pages deployment"
git push origin main

echo.
echo Deployment initiated! 
echo Check your GitHub repository Actions tab for deployment status.
echo Your site will be available at: https://pnext5524-creator.github.io/RK-Grand/
echo.
pause