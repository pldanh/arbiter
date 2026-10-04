# Thở Sạch

Web app cho biết chất lượng không khí theo vị trí và đưa lời khuyên theo từng nhóm người (bình thường, trẻ em, người cao tuổi, người bị hen/dị ứng/tim mạch).

- Dữ liệu: Open-Meteo Air Quality API (miễn phí, không cần key), chỉ số US AQI
- Công nghệ: HTML, CSS, JavaScript thuần. Không cần build, không cần server
- PWA: cài được lên điện thoại

## Chạy thử
```bash
npx serve .
# hoặc: python3 -m http.server 8000
```
Mở http://localhost:8000. Định vị chỉ hoạt động trên localhost hoặc HTTPS.

## Deploy miễn phí
- Vercel / Netlify: kéo thả thư mục, không cần cấu hình.
- GitHub Pages: push lên repo, bật Pages ở Settings.

## Cấu trúc
```
tho-sach/
├── index.html        # khung trang
├── css/style.css     # giao diện, màu theo mức AQI
├── js/app.js         # gọi API, tính lời khuyên, vẽ biểu đồ
├── assets/icon.svg   # biểu tượng app
├── manifest.json     # cấu hình PWA
├── sw.js             # service worker
└── README.md
```

## Hướng phát triển
1. Bản đồ nhiều khu vực (Leaflet + OpenStreetMap)
2. So sánh nhiều thành phố
3. Thông báo khi AQI vượt ngưỡng
4. Tách app.js thành module: api.js, advice.js, ui.js

Thông tin chỉ mang tính tham khảo, không thay thế lời khuyên của bác sĩ.
