# Speeder Cheat

⚡ **Tăng tốc thời gian trên mọi trang web**  
Vượt qua thời gian chờ, đếm ngược và các giới hạn client‑side một cách dễ dàng.

> **Phiên bản:** 1.2.2 Official  
> **Tác giả:** [devrl333](https://github.com/devrl333n)  
> **Tương thích:** Tampermonkey, Violentmonkey, DevMobi (Android WebView)

---

## 🚀 Tính năng nổi bật

- **Tăng tốc thời gian** – Từ 1x đến 1000x, bước nhảy 0.25x. Nhấn nút hoặc nhập số trực tiếp.
- **Turbo Mode** – Một chạm đưa tốc độ lên 1000x, tối ưu cho các trang không kiểm tra thời gian.
- **GhostShield™** – Công nghệ ẩn mình trước các hệ thống anti‑bot. Bảo vệ toàn diện: canvas, WebGL, audio, navigator, visibility, WebRTC.
- **TimeSync** – Tự động sửa timestamp trong request, giúp bạn không bị phát hiện khi tăng tốc.
- **User Simulation** – Mô phỏng thao tác người dùng (cuộn trang, di chuyển chuột) để vượt qua yêu cầu tương tác.
- **Clear Data** – Xoá sạch cookie, localStorage, sessionStorage chỉ bằng một lần chạm.
- **Giao diện tối giản** – Một chấm tròn nhỏ ở góc phải màn hình, chạm để mở bảng điều khiển. Tự động ẩn sau 12 giây không sử dụng.

---

## 📥 Hướng dẫn cài đặt

### 🔹 Cài cho Tampermonkey (PC hoặc Android có hỗ trợ extension)

1. Cài đặt [Tampermonkey](https://www.tampermonkey.net/) cho trình duyệt của bạn.
2. Nhấn vào đường dẫn sau để mở script:

```
https://raw.githubusercontent.com/devrl333n/Speeder-Cheat/main/speeder-cheat.user.js
```

3. Tampermonkey sẽ tự động hiện tab cài đặt – nhấn **Install**.
4. Mở trang web bạn muốn tăng tốc, script sẽ hoạt động ngay.

### 🔹 Cài cho DevMobi (Android WebView)

1. Tải file `speeder-cheat.user.js` từ repo về máy.
2. Đặt file vào thư mục `assets` của ứng dụng DevMobi.
3. Thêm dòng lệnh sau vào code Android để inject script:

```java
webView.loadUrl("javascript:(function() { var s = document.createElement('script'); s.src = 'file:///android_asset/speeder-cheat.user.js'; document.head.appendChild(s); })()");
```

4. Script sẽ tự chạy ngầm và hiển thị chấm tròn điều khiển quen thuộc.

---

## 🕹️ Cách sử dụng

- **Mở bảng điều khiển:** Nhấn (hoặc chạm) vào chấm tròn nhỏ ở góc dưới bên phải màn hình.
- **Thay đổi tốc độ:**
  - Nhấn nút **−** hoặc **+** để tăng/giảm 0.25x.
  - Nhấn trực tiếp vào con số đang hiển thị để nhập tốc độ mong muốn (ví dụ: `5`, `10.5`, `1000`).
- **Turbo 1000x:** Nhấn nút **Turbo 1000x** để lập tức đạt tốc độ tối đa.
- **Xoá dữ liệu:** Nhấn nút **Clear Data** để xoá cookie, localStorage, sessionStorage và tải lại trang.
- **Ẩn bảng điều khiển:** Chạm lại vào chấm tròn, hoặc đợi 12 giây bảng sẽ tự động ẩn.

> 💡 **Mẹo:** Bạn có thể điều khiển tốc độ từ Console (F12) bằng lệnh `SpeedCheat.setSpeed(10)`.

---

## ⚙️ Cấu hình nâng cao (Console)

Mở Developer Tools (F12) và thử các lệnh sau:

```javascript
SpeedCheat.setSpeed(10);        // Đặt tốc độ thành 10x
SpeedCheat.timeSync = false;    // Tắt chức năng sửa timestamp
SpeedCheat.simulate = true;     // Bật mô phỏng thao tác người dùng
SpeedCheat.clearData();         // Xoá dữ liệu và reload trang
```

Tất cả cài đặt sẽ được tự động lưu riêng cho từng website bạn truy cập.

---

## ⚠️ Lưu ý quan trọng

- **Server‑side timer:** Một số trang (như NhapMa, Link4M) sử dụng đồng hồ phía server để kiểm tra thời gian. Speeder Cheat không thể rút ngắn thời gian chờ thực tế trong những trường hợp này – nhưng nó giúp bạn tự động hoá và ẩn mình một cách hoàn hảo.
- **Turbo 1000x:** Có thể khiến một số trang hoạt động không ổn định. Nếu gặp lỗi, hãy giảm tốc độ xuống mức an toàn hơn (ví dụ 10x – 50x).
- **Script chỉ hoạt động ở phía client:** Nó không can thiệp vào server hay dữ liệu cá nhân của bạn.

---

## 🛡️ GhostShield™ – Công nghệ ẩn mình

Speeder Cheat được tích hợp sẵn các lớp bảo vệ chống phát hiện:

| Lớp bảo vệ | Mô tả |
|---|---|
| Canvas / WebGL / Audio | Làm nhiễu dữ liệu vân tay trình duyệt |
| Navigator properties | Giả mạo webdriver, plugins, languages, hardwareConcurrency... |
| Visibility API lock | Luôn báo trạng thái "đang hiển thị" để tránh bị theo dõi |
| WebRTC IP leak | Ngăn rò rỉ địa chỉ IP thật khi dùng proxy/VPN |
| Function.prototype.toString | Đánh lừa các kiểm tra native function |

GhostShield™ giúp bạn yên tâm sử dụng tool mà không sợ bị khoá tài khoản hay chặn IP.

---

## 📄 Giấy phép

MIT – tự do sử dụng, chỉnh sửa và chia sẻ.

---

Enjoy! Nếu bạn thấy hữu ích, hãy ⭐ repo này nhé.  
Mọi vấn đề hoặc góp ý vui lòng mở issue trên GitHub.  
Chúc bạn "vượt ải" thành công! 😄
