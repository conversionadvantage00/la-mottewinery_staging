# La Motte microsite (rebuild)

Modernised rebuild of the La Motte sales microsite (staging10.cawebsitebuilder.co.za), styled to sit alongside la-motte.com.

Static site, no build step and no dependencies: open `index.html` or upload the folder to any host.

- `index.html` – all content (sections, products, experiences, gallery, contact)
- `assets/css/style.css` – design tokens at the top (colours, fonts)
- `assets/js/main.js` – carousels, detail drawer, gallery lightbox, menu, contact form
- `assets/img/` – every image from the original site, optimised to WebP
- `assets/video/` – the hiking experience film

## Notes

- Fonts: Newsreader + Inter + Montserrat (Google Fonts). la-motte.com uses the licensed serif "anko"; to match exactly, add its `@font-face` and put `"anko"` first in `--serif` in `style.css`.
- Contact form posts to the same CA Microsites form (`FRYJHHEER0`) and reCAPTCHA key as the original. Both are set as `data-` attributes on the `<form>`. The reCAPTCHA key must allow the domain this is hosted on.
- Product images that the original loaded from `la-motte.com/cdn/shop/...` no longer resolve there; they were recovered from Shopify's CDN and are stored locally.
