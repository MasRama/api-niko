# FCM Token Removal Documentation

## Perubahan yang Dilakukan

FCM (Firebase Cloud Messaging) token telah dihapus dari aplikasi karena tidak diperlukan.

### File yang Dimodifikasi:

1. **routes/api.ts**
   - Menghapus route `POST /auth/save/fcm-token`

2. **app/controllers/api/AuthApiController.ts**
   - Menghapus method `saveFcmToken()`
   - Menghapus parameter `fcm_token` dari method `login()`
   - Menghapus penyimpanan FCM token ke database saat login

3. **app/middlewares/jwtAuth.ts**
   - Menghapus `fcm_token` dari query select user data

4. **app/middlewares/README.md**
   - Menghapus dokumentasi tentang field `fcm_token`

## Database Schema

Field `fcm_token` masih ada di database (tabel `users` dan `sessions`) tetapi tidak lagi digunakan oleh aplikasi. Jika ingin menghapus sepenuhnya, buat migration untuk drop column tersebut.

## Error yang Diperbaiki

Error `TypeError: Cannot read properties of undefined (reading 'id')` pada endpoint `/api/v1/auth/save/fcm-token` telah teratasi dengan menghapus endpoint tersebut.

## Catatan

Jika di masa depan diperlukan push notification, FCM dapat diimplementasikan kembali dengan:
1. Menambahkan kembali field dan endpoint yang diperlukan
2. Mengintegrasikan dengan Firebase Admin SDK
3. Membuat service untuk mengirim notifikasi