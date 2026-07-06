# Đưa WordPress về subdomain wp.1pdm.agency

Mục đích: sau khi 1pdm.agency trỏ về Vercel, WordPress vẫn phải sống để phục vụ bài viết qua rewrite. WordPress sẽ được truy cập qua wp.1pdm.agency (trên chính VPS hiện tại, không dời đi đâu).

Làm trên giờ thấp điểm. Backup WordPress và VPS trước khi bắt đầu.

## Bước 1: DNS

Thêm record: wp.1pdm.agency, loại A, trỏ về IP VPS hiện tại. Giữ nguyên record của 1pdm.agency cho đến ngày cutover.

## Bước 2: Web server nhận subdomain

Thêm wp.1pdm.agency vào server_name của server block 1pdm.agency hiện tại (nginx), hoặc thêm domain alias trong panel hosting nếu dùng aaPanel, CyberPanel, Plesk.

## Bước 3: SSL

Cấp chứng chỉ cho wp.1pdm.agency (certbot hoặc nút SSL trong panel).

## Bước 4: Cấu hình WordPress

Thêm vào wp-config.php (phía trên dòng "That's all, stop editing"):

    define('WP_HOME', 'https://1pdm.agency');
    define('WP_SITEURL', 'https://wp.1pdm.agency');

Ý nghĩa: WP_HOME giữ nguyên tên miền chính nên mọi link và canonical trong bài viết vẫn là 1pdm.agency (đúng cho SEO). WP_SITEURL là nơi WordPress thật sự chạy, nên wp-admin từ giờ vào bằng wp.1pdm.agency/wp-admin.

## Bước 5: Chặn redirect vòng lặp

Tạo file wp-content/mu-plugins/wp-subdomain-origin.php (tạo thư mục mu-plugins nếu chưa có):

    <?php
    // Khong redirect canonical khi request den tu origin wp.1pdm.agency,
    // vi Vercel proxy cac duong dan bai viet ve day
    add_filter('redirect_canonical', function ($url) {
        $host = $_SERVER['HTTP_HOST'] ?? '';
        return (stripos($host, 'wp.1pdm.agency') !== false) ? false : $url;
    });

## Bước 6: Kiểm tra

1. https://wp.1pdm.agency/tin-tuc/ mở được, không bị redirect về 1pdm.agency.
2. https://wp.1pdm.agency/wp-admin đăng nhập được.
3. Link bên trong bài viết vẫn trỏ về https://1pdm.agency/... (đúng như mong muốn).
4. Báo Claude để test rewrite từ bản preview Vercel trước khi cutover.

## Ghi chú

- Team đăng bài từ giờ bookmark wp.1pdm.agency/wp-admin.
- Không đổi Site Address trong màn hình Settings của WordPress, mọi thứ đã khai báo trong wp-config.php.
