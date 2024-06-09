# [FOSWLY] Media Converter Backend

[![GitHub Stars](https://img.shields.io/github/stars/FOSWLY/media-converter-backend?logo=github&style=for-the-badge)](https://github.com/FOSWLY/media-converter-backend/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/FOSWLY/media-converter-backend?style=for-the-badge)](https://github.com/FOSWLY/media-converter-backend/issues)
[![Current Version](https://img.shields.io/github/v/release/FOSWLY/media-converter-backend?style=for-the-badge)](https://github.com/FOSWLY/media-converter-backend)
[![GitHub License](https://img.shields.io/github/license/FOSWLY/media-converter-backend?style=for-the-badge)](https://github.com/FOSWLY/media-converter-backend/blob/master/LICENSE)

**[FOSWLY] Media Converter Backend** - API для конвертации медиа различных форматов по ссылке.

## Функционал

1. Конвертация m3u8 -> mp4 (с проверкой на бесконечный стрим)
2. Авторизация с помощью токена

## 📦 Деплой

1.  Установите [Bun](https://bun.sh/)
2.  Установите [ffmpeg](https://ffmpeg.org/)
3.  Клонируйте репозиторий
4.  Установите зависимости: `bun install`
5.  Заполните конфиг: `src/config.ts`
6.  Запустите сервер: `bun start`

Если вы хотите использовать PM2:

1. Установите зависимости:

```bash
bun install -g pm2 && pm2 install pm2-logrotate
```

2. Запустите сервер

```bash
pm2 start ecosystem.config.js
```
