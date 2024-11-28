# [FOSWLY] Media Converter Backend

[![GitHub Stars](https://img.shields.io/github/stars/FOSWLY/media-converter-backend?logo=github&style=for-the-badge)](https://github.com/FOSWLY/media-converter-backend/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/FOSWLY/media-converter-backend?style=for-the-badge)](https://github.com/FOSWLY/media-converter-backend/issues)
[![Current Version](https://img.shields.io/github/v/release/FOSWLY/media-converter-backend?style=for-the-badge)](https://github.com/FOSWLY/media-converter-backend)
[![GitHub License](https://img.shields.io/github/license/FOSWLY/media-converter-backend?style=for-the-badge)](https://github.com/FOSWLY/media-converter-backend/blob/master/LICENSE)

> [!WARNING]
> Если конвертер находит отдельно аудио и видео дорожку, то конвертер в приоритетном режиме вернет видео с черным фоном и аудио дорожкой.

**[FOSWLY] Media Converter Backend** - API для конвертации медиа различных форматов по ссылке. Данное API в первую очередь нацеленно на получение аудио дорожки в .mp4 формате, которая будет работать с ffmpeg, поэтому оно может быть не пригодно для повседневного использования

## Функционал

1. Конвертация m3u8 -> mp4 (с проверкой на бесконечный стрим)
2. Конвертация m4a/m4v -> mp4
3. Конветация mpd -> mp4 (только при наличие m4a / m4v)
4. Авторизация с помощью токена

## 📦 Деплой

1. Установите [Bun](https://bun.sh/)
2. Установите [ffmpeg](https://ffmpeg.org/)
3. Установите [MP4Box](https://github.com/gpac/gpac/) (необходим для конвертации m4a без метаданных, который не поддерживается в ffmpeg)
   <!-- 4.  Установите [yt-dlp](https://github.com/yt-dlp/yt-dlp) (необходим для конвертации m3u8 с `.cmfa` сегментами) -->
   <!-- 5.  Установите [aria2c](https://github.com/aria2/aria2) (необходим для ускорения работы yt-dlp) -->
4. Установите PostgreSQL 16+
5. Установите Redis 6.2.0+
6. Установите зависимости: `bun install`
7. Переименуйте .example.env в .env и заполните его
8. Выполните миграцию базы данных

```bash
bun migrate
```

9.  Запустите сервер

```bash
bun start
```

Если вы хотите использовать PM2:

1. Установите зависимости:

```bash
bun install -g pm2-beta && pm2 install pm2-logrotate
```

2. Запустите сервер

```bash
pm2 start ecosystem.config.json
```
