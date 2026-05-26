# Speeder Cheat

⚡ **Speed up time on any website**  
Bypass waiting times, countdowns, and client‑side restrictions with ease.

> **Version:** 1.2.2 Official  
> **Author:** [devrl333](https://github.com/devrl333n)  
> **Compatible with:** Tampermonkey, Violentmonkey, DevMobi (Android WebView)

---

## 🚀 Key Features

- **Time Acceleration** – From 1x to 1000x, in 0.25x steps. Tap a button or type a value directly.
- **Turbo Mode** – One tap to instantly jump to 1000x, perfect for pages with no server-side time checks.
- **GhostShield™** – Stealth technology to stay undetected by anti‑bot systems. Full protection: canvas, WebGL, audio, navigator, visibility, WebRTC.
- **TimeSync** – Automatically patches timestamps in requests so you stay invisible while speeding up.
- **User Simulation** – Simulates user behavior (scrolling, mouse movement) to pass interaction requirements.
- **Clear Data** – Wipe cookies, localStorage, and sessionStorage in a single tap.
- **Minimal UI** – A small floating dot in the corner of the screen. Tap to open the control panel. Auto-hides after 12 seconds of inactivity.

---

## 📥 Installation

### 🔹 Tampermonkey (PC or Android with extension support)

1. Install [Tampermonkey](https://www.tampermonkey.net/) for your browser.
2. Open the script via the link below:

```
https://raw.githubusercontent.com/devrl333n/Speeder-Cheat/main/speeder-cheat.user.js
```

3. Tampermonkey will automatically open the install tab — click **Install**.
4. Navigate to any website you want to speed up. The script activates immediately.

### 🔹 DevMobi (Android WebView)

1. Download `speeder-cheat.user.js` from this repo.
2. Place the file in the `assets` folder of your DevMobi app.
3. Add the following line to your Android code to inject the script:

```java
webView.loadUrl("javascript:(function() { var s = document.createElement('script'); s.src = 'file:///android_asset/speeder-cheat.user.js'; document.head.appendChild(s); })()");
```

4. The script will run silently and display the familiar floating dot controller.

---

## 🕹️ How to Use

- **Open the panel:** Tap or click the small dot in the bottom-right corner of the screen.
- **Change speed:**
  - Press **−** or **+** to decrease/increase by 0.25x.
  - Tap the number directly to type in a custom speed (e.g. `5`, `10.5`, `1000`).
- **Turbo 1000x:** Tap the **Turbo 1000x** button to instantly max out speed.
- **Clear Data:** Tap **Clear Data** to wipe cookies, localStorage, sessionStorage and reload the page.
- **Hide the panel:** Tap the dot again, or wait 12 seconds for it to auto-hide.

> 💡 **Tip:** You can control speed from the browser console (F12) using `SpeedCheat.setSpeed(10)`.

---

## ⚙️ Advanced Configuration (Console)

Open Developer Tools (F12) and try these commands:

```javascript
SpeedCheat.setSpeed(10);        // Set speed to 10x
SpeedCheat.timeSync = false;    // Disable timestamp patching
SpeedCheat.simulate = true;     // Enable user behavior simulation
SpeedCheat.clearData();         // Clear all data and reload the page
```

All settings are saved automatically on a per-domain basis.

---

## ⚠️ Important Notes

- **Server-side timers:** Some sites (e.g. NhapMa, Link4M) validate time on the server. Speeder Cheat cannot shorten the actual server-enforced wait — but it helps you automate and stay hidden perfectly.
- **Turbo 1000x:** May cause instability on some pages. If you encounter issues, reduce the speed to a safer value (e.g. 10x – 50x).
- **Client-side only:** This script does not interact with servers or access any personal data.

---

## 🛡️ GhostShield™ – Stealth Technology

Speeder Cheat includes multiple built-in anti-detection layers:

| Protection Layer | Description |
|---|---|
| Canvas / WebGL / Audio | Fuzzes browser fingerprint data |
| Navigator properties | Spoofs webdriver, plugins, languages, hardwareConcurrency, etc. |
| Visibility API lock | Always reports "visible" state to prevent tab-focus checks |
| WebRTC IP leak prevention | Blocks real IP leaks when using proxies or VPN |
| Function.prototype.toString | Disguises hooked functions as native code |

GhostShield™ lets you use the tool with confidence — no account bans, no IP blocks.

---

## 📄 License

MIT — free to use, modify, and share.

---

Enjoy! If you find this useful, please ⭐ star the repo.  
For issues or suggestions, open a GitHub issue.  
Good luck! 😄
