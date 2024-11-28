# 1.1.0

- The database schema has been changed

  `id` serial -> BigInt (identity column)
  `created_at` timestamp -> timestamptz

- Added config validation
- Added available disk space check
- Added health respose model
- Improved disk space cleanup system
- Updated imports with `@` paths
- Deleted `isOutdated` check
- Rewrited "Repeatable jobs" to the new "Job Schedulers"
- Fix invalid getAll criterias
- Removed SonarJS eslint plugin
- Updated depends

# 1.0.2

- Added support of raw (plain or base64) mpd playlists with set extra_url
- Rework converter of `.mpd` files
- Rework convert mapped `.m3u8` logic (removed yt-dlp + aria2c depends)
- Added separated Manifest type for MPD

# 1.0.1

- Fix converting mapped m3u8 (by using yt-dlp + aria2c)
- Fix converting m3u8 with .cmaf files (by using yt-dlp + aria2c)

# 1.0.0

- Initial release
