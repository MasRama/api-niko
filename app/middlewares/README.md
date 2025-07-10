# JWT Authentication Middleware

Middleware untuk autentikasi JWT yang terpisah dari existing cookie-based authentication.

## Penggunaan

### Import Middleware

```typescript
import jwtAuth, { optionalJwtAuth, refreshableJwtAuth } from './middlewares/jwtAuth';
```

### Jenis Middleware

1. **jwtAuth (default)** - Wajib autentikasi
2. **optionalJwtAuth** - Opsional, untuk endpoint publik dengan user context
3. **refreshableJwtAuth** - Wajib autentikasi dengan support refresh token flow

### Contoh Penggunaan di Routes

```typescript
// Endpoint yang wajib login
router.get('/profile', jwtAuth, async (request, response) => {
  // request.user sudah tersedia
  response.json({
    statusCode: 200,
    message: 'Success',
    data: request.user
  });
});

// Endpoint publik dengan user context opsional
router.get('/events', optionalJwtAuth, async (request, response) => {
  // request.user bisa null atau berisi data user
  const events = await getEvents(request.user?.id);
  response.json({
    statusCode: 200,
    message: 'Success',
    data: events
  });
});

// Endpoint dengan refresh token support
router.post('/booking', refreshableJwtAuth, async (request, response) => {
  // Akan return needRefresh: true jika token expired
  // Client bisa handle refresh token flow
});
```

## Format Token

### Request Header
```
Authorization: Bearer <access_token>
```

### Response Format

#### Success
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... }
}
```

#### Token Error
```json
{
  "statusCode": 401,
  "message": "Token tidak valid",
  "errors": ["Format token tidak valid"],
  "data": null
}
```

#### Token Expired (with refresh support)
```json
{
  "statusCode": 401,
  "message": "Token telah kedaluwarsa",
  "errors": ["Token akses telah kedaluwarsa, gunakan refresh token"],
  "data": { "needRefresh": true }
}
```

## JWT Utils

### Generate Token Pair
```typescript
import { JWTUtils } from '../utils/JWTUtils';

const tokens = JWTUtils.generateTokenPair(userId, email);
// Returns: { accessToken, refreshToken, expiresIn, refreshExpiresIn }
```

### Verify Tokens
```typescript
// Verify access token
const payload = JWTUtils.verifyAccessToken(accessToken);

// Verify refresh token
const payload = JWTUtils.verifyRefreshToken(refreshToken);
```

### Token Information
```typescript
// Check if expired
const isExpired = JWTUtils.isTokenExpired(token);

// Get expiration time
const expTime = JWTUtils.getTokenExpiration(token);

// Decode without verification (debugging)
const payload = JWTUtils.decodeToken(token);
```

## Environment Variables

```env
JWT_SECRET=your-access-token-secret-key
JWT_REFRESH_SECRET=your-refresh-token-secret-key
```

## Token Expiry

- **Access Token**: 1 hour
- **Refresh Token**: 30 days

## Security Features

- HMAC SHA256 signature
- Token type validation (access vs refresh)
- User verification status check
- Session validation in database
- Secure error handling
- Rate limiting ready (can be added)

## Database Integration

Middleware menggunakan tabel `sessions` yang sudah diextend dengan field:
- `access_token`: Untuk validasi token masih aktif
- `refresh_token`: Untuk refresh token flow
- `expires_at`: Untuk cek expiry di database
- `device_type`: Mobile/Web identification
- `device_id`: Unique device identifier
- `fcm_token`: For push notifications 