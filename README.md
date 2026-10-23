# RAU DEV `</>` — Software Engineering Club Website

Official website for **RAU DEV**, the student-led Software Engineering Club at **Romanian-American University (Bucharest)** (Fridays, 11:00 – 14:00, Room 515).

## Quick Start

### Option 1: Local Auto-Save Server (Recommended for Admin Editing)
Double-click `start-server.bat` or run:
```powershell
powershell -ExecutionPolicy Bypass -File .\start-server.ps1 -Port 8080
```
Then open **http://localhost:8080**. Whenever you unlock **Admin Mode** (PIN: `5150`), all scoreboard XP updates, new members, new downloadable solutions/lectures, and news articles are automatically persisted to `data/club-data.json` and `js/default-data.js`!

### Option 2: Direct Browser / Static Hosting (GitHub Pages / Vercel / Netlify)
You can also open `index.html` directly in any browser or deploy the folder to any static host:
- Edits made in **Admin Mode** save immediately to `localStorage`.
- Click **⬇ Export JSON** in the Admin Ribbon to download the updated `club-data.json` file at any time, or **⬆ Import JSON** to load a saved state.

## Key Features
1. **Manual Scoreboard & XP History Breakdown (`#scoreboard`)**:
   - Pre-loaded with the 9 members from the Provisional Scoreboard (**Andreea, Iulian Fecioru, Mihai, Victor, Luci, Denisa, Asik, Damian, Cazacu**), the 13 official XP Actions, and the 10-tier Level & Reward progression ladder (**Rookie** `0 XP` to **Guild Legend** `3500 XP`).
   - Click any member card to inspect the detailed breakdown of how their XP was gained (action, session, date, and verification notes).
   - Unlock **Admin Mode** (PIN: `5150`) to award XP to individual members, run a **Batch Session Check-in** for multiple members, add new members, or delete individual XP log entries.
2. **Downloadable Solutions & Lectures (`#resources`)**:
   - Includes the official **Session 01 Presentation Deck (`.pptx`)**, **Study Guide (`.md`)**, **Git & GitHub Workshop Guide (`.md`)**, **Official Scoreboard & XP Rules (`.xlsx`)**, and commented **Python & C++ solutions** for **CSES 1068 (Weird Algorithm)**, **LeetCode 412 (Fizz Buzz)**, and **LeetCode 349 (Intersection of Two Arrays)**.
   - Includes an in-browser code/notes preview modal and an Admin uploader to publish new solutions and lecture notes.
3. **Updatable News & Club Topics (`#news`)**:
   - Filterable by topic (`Session Recap`, `Weekly Quest`, `Announcement`, `Community`, etc.) with pinned stories, full Markdown article reader, and an Admin News Editor to create, edit, pin, or delete topics.
4. **Meet the Team & Join Hub (`#team` & `#join`)**:
   - Features the Executive, Tech, Logistics, and Tutoring team members alongside the Registration Form QR code, WhatsApp Group QR code, and `@raudev.club` Instagram link.
