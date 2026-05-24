Speeder Cheat

Speed up browsing times on any website, easily bypass countdown timers and shorten links.

Works on PC (Tampermonkey) and Android (DevMobi / WebView).

Version: 1.2 Plus Stable

Author: devrl333

🚀 Main Features

· Speed Boost: from 1x to 100x, 0.25x increments

· Speed Presets: quick tap 1x, 2x, 3x, 5x, 8x, 10x, 16x, 32x, 50x, 100x

· Automatic countdown detection and maximum speed boost

· GhostShield™: prevents detection by anti-bot systems

· Automatically saves speed for each website

· Clear Data: clears cookies, localStorage, sessionStorage and reloads the page

· Incognito Activity: only a small dot in the bottom right corner of the screen, tap to open the control panel

📥 Installation

Method 1: Using Tampermonkey (PC or Android with add-on support)

1. Install Tampermonkey for your browser you.

2. Click the following link to install the script:

speeder-cheat.user.js
3. Tampermonkey will automatically open the installation tab; just click Install.

4. Refresh the webpage you want to speed up, and the script will automatically start.

Method 2: Using DevMobi (Android WebView)

1. Download the speeder-cheat.user.js file from this repository to your computer.

2. Place the file in the assets folder of your DevMobi application.

3. Inject the script into the WebView using the command:

```java

webView.loadUrl("javascript:(function() { var s = document.createElement('script'); s.src = 'file:///android_asset/speeder-cheat.user.js'; document.head.appendChild(s); })()");

```
4. The script will run in the background, displaying a small dot in the bottom right corner for operation.

🕹️ How to use

· Open the control panel: touch (or click) the small circle in the bottom right corner of the screen.

· Change speed:

· Press the − or + buttons to increase/decrease by 0.25x.

· Tap the speed number in the middle to enter a value directly (e.g., 5, 10.5, 100).

· Quickly press the preset buttons (1x, 2x, 5x, 8x…).

· Automatically speed up during a countdown: when the script detects a countdown timer on the page, it will temporarily speed up to the maximum to complete it as quickly as possible.

· Clear page data: press the 🗑 Clear Data button in the control panel to clear cookies, localStorage, sessionStorage and reload the page (use when locked or to refresh the session).

• Hide the control panel: Tap the circle again or wait 20 seconds of inactivity, and the panel will hide automatically.

• Shortcut (PC): Ctrl + Shift + Z to quickly hide/show the control panel.

⚠️ Note

• Some sites may detect time acceleration. GhostShield™ helps reduce the risk, but it is not 100% guaranteed.

• If you are locked out or cannot obtain the code, use the Clear Data button to reset your session.

• Excessive speed (above 16x) may cause some sites to malfunction. Try lowering the speed if you encounter errors.

• The script only runs on the client side and cannot bypass server-side limitations.

📄 License

MIT – free to use, modify, and share.

---

Enjoy! If you find this helpful, please ⭐ this repo.

Please open any issues or provide feedback on GitHub.
