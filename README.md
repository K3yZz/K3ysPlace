# K3yz-Place

todo stockmarket:

- move back button

todo gambling:

- rework design

todo wheelgame:

- rework design

todo chat:

- fix theme


## Favicons

This project injects the favicon and related meta/link tags at runtime from the shared script `globalassets/js/theme.js` so any page that includes that script will display the site icons without adding the tags to every HTML file.

Fallbacks / notes:
- If a page doesn't load `theme.js`, add the standard favicon links to that page's `<head>` or place `favicon.ico` and other common icons at the site root (`/favicon.ico`, `/mstile-144x144.png`) so browsers and platforms can still find them.
- The injected paths point to `/globalassets/css/favicon/...`. If you move the icon files, update the paths in `globalassets/js/theme.js`.
