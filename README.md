# Website 1PDM Agency (bản tĩnh trên Vercel, kết hợp WordPress)

Repo chứa 9 trang chính của 1pdm.agency dưới dạng HTML tĩnh, cào nguyên bản từ WordPress ngày 06/07/2026, chạy trên Vercel. Bài viết, case study, sitemap vẫn do WordPress phục vụ qua rewrite tới wp.1pdm.agency. Chi tiết xem file kế hoạch chuyển đổi bản 2.

## Cấu trúc

- site/ : 9 trang HTML giữ nguyên từng byte so với bản WordPress đang chạy. Ảnh, CSS, font load từ /wp-content/ (được rewrite về WordPress) nên hiển thị giống tuyệt đối.
- api/lead.js : serverless function nhận form. Lead thành task ClickUp (List "[Lead] Website"), kèm kênh dự phòng Google Sheet.
- assets/leads.js : script chuyển form Elementor sang gửi về /api/lead, bắn sự kiện dataLayer pdm_lead (đúng tên trigger Google Ads đang chờ) và generate_lead. Chưa gắn vào trang, bật khi test trên preview.
- vercel.json : cấu hình Vercel, gồm toàn bộ rewrite các đường dẫn WordPress về wp.1pdm.agency.
- docs/wordpress-subdomain.md : hướng dẫn đưa WordPress về wp.1pdm.agency (việc duy nhất cần người rành server, khoảng 30 đến 60 phút, hoặc anh Phú tự làm theo hướng dẫn).

## Biến môi trường trên Vercel (Project > Settings > Environment Variables)

1. CLICKUP_TOKEN (bắt buộc) : ClickUp, avatar góc màn hình, Settings, mục Apps, API Token. Anh Phú tự dán, không gửi qua chat.
2. RECAPTCHA_SECRET (nên có) : secret key reCAPTCHA của site, xem trong cài đặt Elementor hoặc Google reCAPTCHA admin.
3. CLICKUP_LIST_ID (tùy chọn) : mặc định 901819272476, List "[Lead] Website".
4. GOOGLE_SHEET_WEBHOOK (tùy chọn) : URL Apps Script để ghi lead song song vào Google Sheet.

## Các bước lên sóng

1. Đẩy code lên GitHub (private repo 1pdm-website): kéo thả toàn bộ nội dung thư mục này lên trang upload của GitHub, hoặc git push.
2. Vercel: Add New Project, Import repo, giữ nguyên cài đặt (vercel.json lo hết), thêm biến môi trường, Deploy. Nhận domain preview dạng 1pdm-website.vercel.app.
3. reCAPTCHA admin: thêm domain preview vào danh sách domain được phép, giữ 1pdm.agency.
4. Gắn leads.js vào 9 trang (Claude làm), test 5 lead thử trên preview: task hiện trong ClickUp, sự kiện pdm_lead hiện trong GTM Preview.
5. WordPress subdomain theo docs/wordpress-subdomain.md, xong thì test các đường dẫn /tin-tuc/, /case-study/... trên preview.
6. Checklist SEO: so title, meta, canonical, schema từng trang với bản thật (Claude chạy script).
7. Cutover: thêm domain 1pdm.agency vào project Vercel, đổi DNS theo hướng dẫn Vercel hiển thị. Rollback bằng cách trỏ DNS về IP VPS cũ.
8. Sau cutover: gửi 1 lead thật, xác nhận Google Ads ghi nhận conversion trong 24 đến 48 giờ, theo dõi Search Console 2 tuần.

## Tracking (đã rà trực tiếp trong GTM ngày 06/07/2026)

- GTM container GTM-P82B7B4F nằm sẵn trong HTML cả 9 trang, giữ nguyên.
- GA4 G-MMR8RGB8VQ gắn trực tiếp ngoài GTM, giữ nguyên trong HTML.
- Google Ads AW-11556431823 với 3 conversion: form (sự kiện pdm_lead), gọi điện (pdm_call), Zalo (click id khach-tu-van-zalo). Không tạo mới, không đổi tên sự kiện.
- Meta Pixel, Plerdy và nút gọi nổi đều chèn qua GTM nên tự chạy tiếp.

## Quy tắc sửa giao diện bằng AI

1. Chỉ rõ trang và section cần sửa, luôn kèm câu "giữ nguyên mọi phần khác".
2. Mỗi lần push, Vercel tự tạo link preview. Xem bằng mắt rồi mới promote lên production.
3. Hỏng thì revert commit, không sửa chồng lên lỗi.
4. 9 trang trong repo chỉ sửa qua code. Sửa trong WordPress không còn tác dụng với các trang này. Bài viết vẫn đăng trong wp-admin như cũ tại wp.1pdm.agency/wp-admin.
