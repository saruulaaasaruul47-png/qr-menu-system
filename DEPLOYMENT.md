# Deploy хийх дэлгэрэнгүй заавар

Энэ project нь нэг GitHub repository дотор `backend` болон `frontend`-ээ хамт хадгалдаг monorepo бүтэцтэй. Гэхдээ deploy хийх үед backend service-үүд Render дээр тус тусдаа service болж, frontend нь Vercel дээр тусдаа app болж ажиллана.

```text
GitHub repository
+-- backend/
|   +-- services/api-gateway
|   +-- services/auth-service
|   +-- services/menu-service
|   +-- services/order-service
|   +-- ...
+-- frontend/
+-- render.yaml
+-- .github/workflows/ci.yml
```

Товчоор:

- GitHub repo нэг байна.
- Render `render.yaml`-г уншаад backend service бүрийг тусад нь deploy хийнэ.
- Vercel мөн тэр repo-г ашиглана, гэхдээ зөвхөн `frontend` folder-оос build хийнэ.
- GitHub Actions эхлээд test/build шалгаад, шалгалт амжилттай бол Render deploy үргэлжилнэ.

## 1. Deploy хийхээс өмнө local дээр шалгах

Эхлээд backend-ээ шалгана:

```powershell
cd backend
npm ci
npm run prisma:generate
npx prisma validate
npm test
```

Эдгээр командын утга:

- `npm ci` dependency-г lock file-ийн дагуу цэвэр суулгана.
- `npm run prisma:generate` Prisma client үүсгэнэ.
- `npx prisma validate` schema зөв эсэхийг шалгана.
- `npm test` backend test-үүдийг ажиллуулна.

Дараа нь frontend-ээ шалгана:

```powershell
cd frontend
npm ci
npm run lint
npm run build
```

Эдгээр команд амжилттай бол GitHub руу push хийхэд бэлэн гэсэн үг.

## 2. GitHub руу push хийх

Нэг repository руу бүх project-оо push хийнэ:

```text
backend/
frontend/
render.yaml
.github/workflows/ci.yml
DEPLOYMENT.md
```

Backend service бүрийг тус тусад нь repository болгох шаардлагагүй. Render дээр deploy хийх үед л тус тусдаа service болж сална.

## 3. GitHub Actions CI

`.github/workflows/ci.yml` файл дараах шалгалтыг автоматаар хийнэ:

- Backend dependencies суулгана.
- Prisma client generate хийнэ.
- Prisma schema validate хийнэ.
- Backend test ажиллуулна.
- Backend service entrypoint-уудын syntax шалгана.
- Frontend lint ажиллуулна.
- Frontend production build хийнэ.

`render.yaml` дотор service бүр дээр:

```yaml
autoDeployTrigger: checksPass
```

гэж байгаа. Тиймээс GitHub Actions амжилттай дууссаны дараа Render deploy эхлэх ёстой.

## 4. Render дээр backend deploy хийх

Render dashboard дээр:

1. `New` дарна.
2. `Blueprint` сонгоно.
3. GitHub repository-гоо холбоно.
4. Render root дээр байгаа `render.yaml` файлыг уншина.
5. Render database болон backend service-үүдийг үүсгэнэ.

Үүсэх backend service-үүд:

```text
qr-api-gateway
qr-auth-service
qr-restaurant-service
qr-menu-service
qr-order-service
qr-payment-service
qr-notification-service
qr-analytics-service
qr-qr-service
qr-loyalty-service
qr-audit-service
```

Мөн database:

```text
qr-postgres
```

Render service бүр өөр өөр Dockerfile ашиглана. Жишээ:

```text
qr-api-gateway  -> backend/services/api-gateway/dockerfile
qr-auth-service -> backend/services/auth-service/dockerfile
qr-menu-service -> backend/services/menu-service/dockerfile
```

## 5. Render environment variables

Render Blueprint үүссэний дараа `qr-menu-backend-common` env group дээр дараах утгуудыг заавал бөглөнө.

```env
JWT_ACCESS_SECRET=long_random_secret
JWT_REFRESH_SECRET=another_long_random_secret
APP_PUBLIC_URL=https://your-frontend-domain
CORS_ORIGIN=https://your-frontend-domain
STRIPE_SECRET_KEY=sk_live_or_test_...
STRIPE_PUBLISHABLE_KEY=pk_live_or_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYMENT_WEBHOOK_SECRET=random_provider_webhook_secret
```

Тайлбар:

- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` нь login token хамгаалах secret.
- `APP_PUBLIC_URL` нь frontend-ийн public URL. QR link болон payment success/cancel redirect-д ашиглагдана.
- `CORS_ORIGIN` нь frontend domain. Жишээ нь `https://your-app.vercel.app`.
- `STRIPE_SECRET_KEY` нь Stripe backend secret key.
- `STRIPE_PUBLISHABLE_KEY` нь Stripe frontend/public key.
- `STRIPE_WEBHOOK_SECRET` нь Stripe webhook endpoint үүсгэсний дараа авдаг `whsec_...` утга.
- `PAYMENT_WEBHOOK_SECRET` нь generic provider webhook ашиглах үед signature шалгахад хэрэглэнэ.

Email notification ашиглах бол:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=QR Menu <no-reply@your-domain.com>
```

Email одоохондоо хэрэглэхгүй бол SMTP утгуудыг хоосон үлдээж болно.

`DATABASE_URL`-ийг env group дээр гараар бичих шаардлагагүй. Render env group дотор `fromDatabase` ажиллахгүй тул `render.yaml` дээр service бүрийн `envVars` дотор `qr-postgres`-оос автоматаар холбоно.

Жишээ нь service бүр дээр ийм хэлбэртэй байна:

```yaml
envVars:
  - fromGroup: qr-menu-backend-common
  - key: DATABASE_URL
    fromDatabase:
      name: qr-postgres
      property: connectionString
```

Render дээр `envVarGroups[0].envVars[1] must have a key and value` гэсэн алдаа гарвал `DATABASE_URL` env group дотор орчихсон байна гэсэн үг. Түүнийг service бүрийн `envVars` руу шилжүүлнэ.

## 6. Gateway service URL-ууд тохируулах

Backend service-үүд үүссэний дараа `qr-api-gateway` service дээр бусад service-ийн URL-уудыг тохируулна.

```env
AUTH_SERVICE_URLS=https://qr-auth-service.onrender.com
RESTAURANT_SERVICE_URLS=https://qr-restaurant-service.onrender.com
MENU_SERVICE_URLS=https://qr-menu-service.onrender.com
ORDER_SERVICE_URLS=https://qr-order-service.onrender.com
PAYMENT_SERVICE_URLS=https://qr-payment-service.onrender.com
NOTIFICATION_SERVICE_URLS=https://qr-notification-service.onrender.com
ANALYTICS_SERVICE_URLS=https://qr-analytics-service.onrender.com
QR_SERVICE_URLS=https://qr-qr-service.onrender.com
LOYALTY_SERVICE_URLS=https://qr-loyalty-service.onrender.com
AUDIT_SERVICE_URLS=https://qr-audit-service.onrender.com
```

Хэрэв Render өөр URL өгсөн бол дээрх URL-уудыг өөрийн бодит Render URL-аар солино.

Gateway л frontend-ээс шууд дуудагдана. Frontend бусад service рүү шууд хандахгүй.

```text
Frontend -> qr-api-gateway -> auth/menu/order/payment/etc service
```

## 7. Frontend deploy хийх

Vercel дээр:

1. `New Project` дарна.
2. Нөгөө GitHub repository-гоо сонгоно.
3. Project settings дээр:

```text
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

4. Environment variable нэмнэ:

```env
VITE_API_BASE_URL=https://qr-api-gateway.onrender.com/api/v1
```

Хэрэв gateway URL өөр бол өөрийн gateway URL-аар солино.

Frontend deploy дууссаны дараа гарсан Vercel domain-оо Render env дээр:

```env
APP_PUBLIC_URL=https://your-app.vercel.app
CORS_ORIGIN=https://your-app.vercel.app
```

гэж тохируулна.

## 8. Stripe webhook тохируулах

Stripe dashboard дээр:

1. `Developers` орно.
2. `Webhooks` орно.
3. `Add endpoint` дарна.
4. Endpoint URL дээр:

```text
https://qr-api-gateway.onrender.com/api/v1/payments/stripe/webhook
```

тавина.

5. Event дээр:

```text
checkout.session.completed
```

сонгоно.

6. Webhook үүссэний дараа Stripe `whsec_...` secret өгнө.
7. Тэр secret-ийг Render env дээр:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

гэж тавина.

## 9. Prisma database schema

Backend Docker image build хийх үед Prisma client generate хийгдэнэ. Service startup дээр `prisma db push` ажиллуулахгүй. Ингэснээр database түр unreachable үед service шууд унтрахгүй.

Анхны deploy-ийн дараа Render Shell дээр backend service-ийн аль нэг дээр нэг удаа schema sync хийнэ. Жишээ нь `qr-auth-service` дээр Shell нээгээд:

```bash
cd /app
npx prisma validate
npx prisma db push --schema /app/prisma/schema.prisma --url "$DATABASE_URL"
```

ажиллуулж шалгаж болно.

Хэрэв `P1001: Can't reach database server` гарвал:

- `qr-postgres` database `Available` болсон эсэхийг шалгана.
- Service болон database ижил Render workspace/region дээр байгаа эсэхийг шалгана.
- Backend service дээр `DATABASE_URL` env байгаа эсэхийг шалгана.
- Internal Database URL ашиглаж байгаа эсэхийг шалгана.

## 10. Эхний super admin үүсгэх

Deploy амжилттай болсны дараа `qr-auth-service` дээр Render Shell нээгээд:

```bash
cd /app
npm run seed:superadmin
```

ажиллуулна.

Хэрэв өөр email/password ашиглах бол `qr-menu-backend-common` эсвэл `qr-auth-service` env дээр:

```env
SUPERADMIN_EMAIL=superadmin@example.com
SUPERADMIN_PASSWORD=strong-password
SUPERADMIN_NAME=Super Admin
```

гэж тавиад service restart хийсний дараа seed ажиллуулна.

## 11. Deploy дараах health check

Эхлээд backend health endpoint-уудыг шалгана:

```text
https://qr-api-gateway.onrender.com/health
https://qr-auth-service.onrender.com/health
https://qr-menu-service.onrender.com/health
https://qr-order-service.onrender.com/health
https://qr-payment-service.onrender.com/health
```

Амжилттай бол response дотор `status: ok` ирнэ.

Дараа нь frontend дээр:

- Register ажиллаж байна уу
- Login ажиллаж байна уу
- Restaurant setup ажиллаж байна уу
- Menu category CRUD ажиллаж байна уу
- Food CRUD ажиллаж байна уу
- QR public menu нээгдэж байна уу
- Order үүсэж байна уу
- Inventory decrement хийж байна уу
- Cancel/refund үед inventory restore хийж байна уу
- Coupon apply болж байна уу
- Payment checkout ажиллаж байна уу
- Stripe webhook payment success авч байна уу
- Analytics dashboard data харуулж байна уу
- Socket.IO realtime order update ирж байна уу

гэсэн дарааллаар шалгана.

## 12. Хамгийн түгээмэл алдаанууд

### Frontend API request fail болох

Шалгах env:

```env
VITE_API_BASE_URL=https://qr-api-gateway.onrender.com/api/v1
```

Мөн Render дээр:

```env
CORS_ORIGIN=https://your-app.vercel.app
```

зөв эсэхийг шалгана.

### Gateway бусад service рүү proxy хийж чадахгүй байх

`qr-api-gateway` env дээр service URL-ууд зөв эсэхийг шалгана:

```env
AUTH_SERVICE_URLS=...
MENU_SERVICE_URLS=...
ORDER_SERVICE_URLS=...
PAYMENT_SERVICE_URLS=...
```

### Database connection error

`DATABASE_URL` Render Postgres-оос автоматаар орж ирсэн эсэхийг шалгана. Гараар localhost URL тавьж болохгүй.

### Stripe checkout ажиллахгүй байх

Шалгах env:

```env
STRIPE_SECRET_KEY=...
STRIPE_PUBLISHABLE_KEY=...
APP_PUBLIC_URL=https://your-app.vercel.app
```

Webhook success ирэхгүй бол:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

зөв эсэхийг шалгана.

### Socket.IO realtime update ирэхгүй байх

Frontend `VITE_API_BASE_URL` gateway руу зааж байгаа эсэхийг шалгана. Мөн gateway service public URL ажиллаж байгаа эсэхийг `/health` endpoint-оор шалгана.

## 13. Deploy дарааллын товч checklist

1. Local backend test ажиллуулна.
2. Local frontend build ажиллуулна.
3. GitHub руу push хийнэ.
4. GitHub Actions pass болохыг шалгана.
5. Render Blueprint deploy хийнэ.
6. Render env values бөглөнө.
7. Gateway service URL-уудыг тохируулна.
8. Vercel дээр frontend deploy хийнэ.
9. `VITE_API_BASE_URL` тохируулна.
10. Vercel URL-аа Render `APP_PUBLIC_URL`, `CORS_ORIGIN` дээр тавина.
11. Stripe webhook тохируулна.
12. Super admin seed ажиллуулна.
13. Health endpoint-ууд шалгана.
14. Register/login/menu/order/payment/analytics/realtime flow-уудыг шалгана.
