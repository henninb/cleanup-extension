# Cleanup Extension

A Chrome/Chromium browser extension (Manifest V3) that removes unwanted popups and auto-deletes tracking cookies across financial and utility websites. It also applies custom CSS/JS tweaks to the Proxmox web UI.

## Features

- Removes cookie consent popups and nag dialogs on supported sites
- Auto-deletes tracking cookies via Declarative Net Request rules
- Monitors and reports localStorage access (`ls-guard.js`, `ls-reporter.js`)
- Dashboard for viewing cleanup activity
- Site-specific scripts for:
  - Barclaycard, American Express, Target, Capital One, Wells Fargo
  - Bank of America, CenterPoint Energy, InvoiceCloud
  - Proxmox web UI (custom CSS/JS)

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** and select this directory

## Files

| File | Description |
|------|-------------|
| `manifest.json` | Extension manifest (MV3) |
| `background.js` | Service worker |
| `rules.json` | Declarative Net Request blocking rules |
| `ls-guard.js` | localStorage access guard (MAIN world) |
| `ls-reporter.js` | Reports localStorage activity |
| `popup.html` / `popup.js` | Popup UI |
| `dashboard.html` / `dashboard.js` | Activity dashboard |
| `*.js` | Site-specific cleanup scripts |
| `proxmox.css` / `proxmox.js` | Proxmox UI enhancements |
