# RAU DEV `</>` — Software Engineering Club Website

Official website for **RAU DEV**, the student-led Software Engineering Club at **Romanian-American University (Bucharest)** (Fridays, 11:00 – 14:00, Room 515).

## Launching the Server & Selecting the Admin Password

Double-click `start-server.bat` or run:
```powershell
powershell -ExecutionPolicy Bypass -File .\start-server.ps1 -Port 8080
```
Right at launch, the server prompts you in the terminal to **select/enter the Admin Password for the session** (you can also pass `-AdminPassword "your-password"` on the command line).

Once the server is running at **http://localhost:8080**:
- Press **`Ctrl + Shift + A`** (or **`Alt + A`**, navigate to **`#admin`**, or double-click the **`RAU DEV </>`** logo in the left sidebar) to open the password prompt and authenticate with the password you selected at launch.
- There are no visible references to Admin Mode on the public UI.

## Pages
- **[index.html](file:///C:/Users/tacp0/.gemini/antigravity/scratch/rau-dev-website/index.html) (Overview):** Minimalist club overview, Sign-Up & WhatsApp QR codes, Instagram (`https://www.instagram.com/raudev.club/`) and LinkedIn (`https://www.linkedin.com/company/rau-dev/`) profiles, Friday schedule strip, and the 5 core pillars.
- **[scoreboard.html](file:///C:/Users/tacp0/.gemini/antigravity/scratch/rau-dev-website/scoreboard.html) (Scoreboard):** Minimalist interactive leaderboard with expandable member XP logs, level progression ladder, and management tools to add, modify, or delete member details and award XP.
- **[resources.html](file:///C:/Users/tacp0/.gemini/antigravity/scratch/rau-dev-website/resources.html) (Resources):** Downloadable lectures, slides, and challenge solutions.
- **[news.html](file:///C:/Users/tacp0/.gemini/antigravity/scratch/rau-dev-website/news.html) (Club News):** Updatable club news and topics.
- **[team.html](file:///C:/Users/tacp0/.gemini/antigravity/scratch/rau-dev-website/team.html) (Meet the Team):** Executive, Tech, Logistics, and Tutoring team members.
