# 52 Cafe — Sổ thu chi

Ứng dụng web dành cho điện thoại: ghi thu chi tiền mặt/chuyển khoản, xem doanh thu theo ngày, chốt két và quản lý tài khoản nhân viên.

## Công nghệ
React, Vinext/Vite, Cloudflare Workers và D1.

## Chạy và triển khai
Node.js >=22.13.0. Chạy `npm ci`, `npm run build`. Dữ liệu dùng binding D1 `DB`; migrations trong `drizzle/`. Đặt `OWNER_INITIAL_PASSWORD` bằng biến bí mật trên máy chủ, không ghi mật khẩu vào GitHub. Tài khoản chủ quán: `chuquan`; đổi mật khẩu sau lần đăng nhập đầu tiên.

`.openai/hosting.json` giữ danh tính Sites hiện có. Không tạo một Sites khác cho cùng dự án. Triển khai web có cơ sở dữ liệu cần Cloudflare Workers/Sites; GitHub Pages không chạy được phần máy chủ này.

## Trạng thái
Mã nguồn đã qua kiểm tra TypeScript, dựng production và kiểm tra nghiệp vụ đăng nhập/phân quyền/thu chi/chốt két. Chưa xác nhận triển khai web trực tuyến. Chuyển khoản được nhân viên xác nhận thủ công; thu trừ chi chưa phải lợi nhuận kế toán.
