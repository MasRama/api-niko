#!/usr/bin/env bash
# ==========================================================
# Automated MCC API Test Script
# Runs a sequence of curl requests to validate main flows
# Target server must be running on http://localhost:5555
# Requirements: bash 4+, curl, (opsional) jq
# Usage:
#   chmod +x test_api_flow.sh
#   ./test_api_flow.sh [email] [password]
# ==========================================================

# Exit on errors, unset vars error, pipefail
set -euo pipefail

# Detect jq availability
if command -v jq >/dev/null 2>&1; then
  JQ="jq"
else
  echo "⚠️  Perintah 'jq' tidak ditemukan. Output akan ditampilkan mentah tanpa pemformatan."
  # Define dummy jq that just cat input
  JQ="cat"
fi

EMAIL=${1:-tester@mail.com}
PASSWORD=${2:-secret123}
PORT=5555
BASE_URL="http://localhost:${PORT}/api/v1"

echo "===> 1. Health Check"
curl -s ${BASE_URL}/health | $JQ

echo "===> 2. List Endpoints"
curl -s ${BASE_URL}/endpoints | $JQ | head -n 20

echo "===> 3. Login"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${BASE_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

# Split response body and status code
HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [[ "$HTTP_CODE" == "422" ]]; then
  echo "   ℹ️  User belum terdaftar. Melakukan registrasi..."
  RANDOM_PHONE="08$((RANDOM%900000000+100000000))"
  echo "   → Mencoba registrasi dengan nomor $RANDOM_PHONE"
  reg_resp=$(curl -s -w "\n%{http_code}" -X POST ${BASE_URL}/auth/register-personal \
        -F "name=Tester" -F "email=${EMAIL}" -F "password=${PASSWORD}" -F "phone=${RANDOM_PHONE}")
  reg_status=$(echo "$reg_resp" | tail -n1)
  reg_body=$(echo "$reg_resp" | sed '$d')
  if [[ "$reg_status" == "201" ]]; then
     echo "   ✔️  Registrasi berhasil."
  else
     echo "⚠️  Registrasi gagal (HTTP $reg_status). Response: $reg_body"
  fi
  echo "   → Mencoba login kembali..."
  LOGIN_BODY=$(curl -s -X POST ${BASE_URL}/auth/login \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")
else
  LOGIN_BODY="$LOGIN_BODY"
fi

ACCESS_TOKEN=$(echo "$LOGIN_BODY" | $JQ -r '.data.access_token // empty')
IS_VERIFIED=$(echo "$LOGIN_BODY" | $JQ -r '.data.is_verified_user // empty')

if [[ -z "$ACCESS_TOKEN" ]]; then
  echo "⚠️  Login berhasil tetapi akun belum terverifikasi." 
  echo "$LOGIN_BODY" | $JQ
  echo "   → Beberapa endpoint mungkin menolak akses sampai verifikasi selesai."
else
  echo "   ✔️  Login sukses. Token: ${ACCESS_TOKEN:0:20}..."
fi

# Define auth header only if we have token
if [[ -n "$ACCESS_TOKEN" ]]; then
  auth_header=( -H "Authorization: Bearer $ACCESS_TOKEN" )
else
  auth_header=()
fi

echo "===> 5. Get User Profile"
curl -s "${BASE_URL}/users/profile-user" "${auth_header[@]}" | $JQ '.data' || true

echo "===> 6. Infrastruktur List"
curl -s "${BASE_URL}/infrastructure/list" | $JQ '.data | .[0:5]'

echo "===> 6b. Infrastruktur (alias bahasa)"
curl -s "${BASE_URL}/infrastruktur/sarana-prasarana" | $JQ '.data | .[0:5]'

echo "===> 6c. Kategori Dropdown"
curl -s "${BASE_URL}/kategori?fields=id,nama" | $JQ '.data'

echo "===> 6d. Booking Jadwal (alias)"
SAMPLE_PRASARANA_ID="1"
TODAY=$(date +%Y-%m-%d)
curl -s "${BASE_URL}/booking/show-jadwal/${SAMPLE_PRASARANA_ID}?date=${TODAY}" | $JQ '.data | .[0:5]'

echo "===> 6e. Data Ekraf"
curl -s "${BASE_URL}/ekraf?fields=id,nama" | $JQ '.data | .[0:5]'

echo "===> 6f. Kategori Event"
curl -s "${BASE_URL}/kategori-event?fields=id,nama_kategori" | $JQ '.data | .[0:5]'

echo "===> 6g. Prasarana List (untuk filter)"
curl -s "${BASE_URL}/prasarana?fields=id,nama_prasarana" | $JQ '.data | .[0:5]'

echo "===> 6h. Create Booking (alias flow)"
BOOKING_RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/booking/booking-ruangan" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "nama_event=Tes API Event" \
  -F "tipe_event=internal" \
  -F "kategori_event_id=5" \
  -F "nama_pic=API Tester" \
  -F "no_telp_pic=081234567890" \
  -F "prasarana_bookings[0][prasarana_mcc_id]=1" \
  -F "prasarana_bookings[0][tanggal_penggunaan]=$TODAY" \
  -F "prasarana_bookings[0][waktu_booking_id][0]=1" \
  -F "banner_event=@/home/ramaren/docs-project/niko/backendtes.jpg" ) || true
BOOKING_CODE=$(echo "$BOOKING_RESP" | tail -n1)
BOOKING_BODY=$(echo "$BOOKING_RESP" | sed '$d' | $JQ 2>/dev/null || echo "$BOOKING_RESP" | sed '$d')

echo "Status Code Booking: $BOOKING_CODE"
 echo "$BOOKING_BODY"

echo "===> 7. Booking Status (sesudah create)"
curl -s "${BASE_URL}/booking/status" "${auth_header[@]}" | $JQ '.data | .[0:5]' || true

echo "===> 8. Events List"
curl -s "${BASE_URL}/event-mcc?page=1&limit=5" | $JQ '.data'

echo "===> 9. Feedback Statistics (requires JWT)"
curl -s "${BASE_URL}/feedback/statistics" "${auth_header[@]}" | $JQ '.data' || true

echo "\n🎉  Semua request selesai." 