# API Request Logging Implementation

## Overview
Sistem logging telah diimplementasikan untuk mencatat semua request dan response API secara detail untuk keperluan debugging dan monitoring.

## Implementasi

### 1. Request Logger Middleware
File: `app/middlewares/requestLogger.ts`

Middleware ini akan mencatat:
- **Request Details**: Method, URL, Headers, Timestamp
- **Query Parameters**: Parameter URL query jika ada
- **URL Parameters**: Parameter dari route path
- **Request Body**: Data yang dikirim (untuk POST, PUT, PATCH)
- **User Info**: Informasi user yang terautentikasi (jika ada)
- **Response Details**: Status code, response data, durasi request

### 2. Integrasi dengan API Routes
File: `routes/api.ts`

Middleware diterapkan pada semua route API dengan:
```typescript
// Apply request logging to all API routes for debugging
ApiRoute.use(requestLogger);
```

### 3. Format Log Output

Middleware akan menghasilkan satu log gabungan untuk setiap API call:

#### API Log:
```
📋 API Log: {
  "timestamp": "2024-01-15T10:30:45.123Z",
  "request": {
    "url": "/api/v1/auth/login",
    "headers": {
      "content-type": "application/json",
      "authorization": "Bearer ...",
      "user-agent": "..."
    },
    "body": {
      "email": "user@example.com",
      "password": "secretpassword"
    }
  },
  "response": {
    "data": {
      "statusCode": 200,
      "message": "Login berhasil",
      "data": {
        "access_token": "...",
        "refresh_token": "..."
      }
    }
  },
  "duration": "333ms"
}
```

## Kegunaan

1. **Debugging**: Melihat detail request yang masuk dan response yang keluar
2. **Error Tracking**: Mengidentifikasi request yang menyebabkan error
3. **Performance Monitoring**: Melihat durasi setiap request
4. **Security Audit**: Memantau akses API dan autentikasi
5. **API Usage Analysis**: Menganalisis pola penggunaan API

## Catatan Penting

- Response data dibatasi 1000 karakter untuk menghindari log yang terlalu panjang
- Password dan data sensitif lainnya tetap terlog, pastikan log file aman
- Middleware ini akan berjalan untuk semua endpoint API di `/api/v1/*`
- Log akan muncul di console server

## Contoh Penggunaan

Setelah implementasi, setiap kali ada request ke API (misalnya dari frontend mobile app), Anda akan melihat log detail di console server yang membantu debugging masalah seperti:

- Request tidak sampai ke controller
- Data request tidak sesuai format
- Response error tidak jelas
- Masalah autentikasi JWT
- Performance bottleneck

## Disable Logging

Jika ingin menonaktifkan logging (misalnya di production), comment atau hapus baris berikut di `routes/api.ts`:

```typescript
// ApiRoute.use(requestLogger);
```