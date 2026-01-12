@echo off
echo Деплой на GitHub Pages...

git add .
git commit -m "Update GitHub Pages deployment"
git push origin main

echo.
echo Изменения отправлены на GitHub!
echo Сайт будет доступен через несколько минут по адресу:
echo https://pnext5524-creator.github.io/RK-Grand/
echo.
pause