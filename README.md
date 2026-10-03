# استودیو اسلاید — سایت سفارش پاورپوینت

نسخهٔ استاتیک فارسی و راست‌چین برای GitHub Pages، همراه با Google Apps Script و Google Sheets. اجرای رابط به Node یا Python نیاز ندارد.

## معماری و پوشه‌ها

```text
index.html                 سایت عمومی: خدمات، تعرفه، نمونه‌کار، سفارش، پرداخت و پیگیری
admin/index.html           ورود و پنل مدیریت
assets/css/style.css       طراحی پایه و نسخهٔ چاپ
assets/css/responsive.css  چیدمان Mobile First و بازآرایی تبلت و دسکتاپ
assets/js/config.js        تنها محل آدرس API
assets/js/api.js           لایهٔ ارتباط با Apps Script
assets/js/quote.js         محاسبهٔ مبلغ بر اساس تعداد اسلاید
assets/js/jalali.js        تاریخ شمسی و اعتبارسنجی آن
assets/js/site.js          جریان مشتری
assets/js/admin.js         جریان مدیریت
apps-script/Code.gs        API، اعتبارسنجی، منطق سفارش و اتصال Sheet
```

صفحه‌ها را در ریشهٔ مخزن GitHub قرار دهید و GitHub Pages را از همان شاخه و پوشهٔ root فعال کنید. مسیر پنل `/admin/` است. نشانی Web App در `assets/js/config.js` ثبت شده است. نمونه‌کارها و تعرفه‌ها هنگام باز شدن صفحه از API دریافت می‌شوند.

لینک «پشتیبانی تلگرام» در نوار دسکتاپ و منوی موبایل نمایش داده می‌شود. در موبایل یک دکمهٔ مستقیم هم کنار منو دارد. نشانی لینک از `telegram_username` در تنظیمات پنل خوانده می‌شود؛ تا زمانی که آیدی ثبت نشده باشد، این دو لینک نمایش داده نمی‌شوند.

## ساختار Google Sheets

تابع `setupSpreadsheet()` این برگه‌ها و سرستون‌ها را می‌سازد: `Orders`, `Customers`, `Payments`, `Deliveries`, `Invoices`, `Pricing`, `Portfolio`, `Settings`, `Admins`. ستون‌های پایهٔ خواسته‌شده حفظ شده‌اند. ستون‌های کمکی برای جریان واقعی اضافه شده‌اند.

| برگه | ستون‌ها |
| --- | --- |
| Orders | order_id, created_at, customer_id, first_name, last_name, phone, telegram, subject, description, slides_count, pricing_id, pricing_name, total_amount, deposit_amount, remaining_amount, order_status, updated_at |
| Customers | customer_id, created_at, first_name, last_name, phone, telegram |
| Payments | payment_id, order_id, amount, tracking_number, payment_date, status, verified_at, note, created_at |
| Deliveries | delivery_id, order_id, file_id, file_name, mime_type, size_bytes, created_at, active |
| Invoices | invoice_id, order_id, invoice_number, created_at, total_amount, deposit_amount, remaining_amount, status |
| Pricing | pricing_id, name, price, description, features, active |
| Portfolio | portfolio_id, title, category, description, image_url, preview_urls, active |
| Settings | key, value |
| Admins | admin_id, username, password_hash, salt, active, created_at |

شناسه‌ها زیر قفل `LockService` ساخته می‌شوند تا هم‌زمانی باعث تکرار نشود. مبلغ هر سفارش هنگام ثبت از تعرفهٔ همان لحظه ثبت می‌شود تا تغییر قیمت‌های بعدی فاکتور قبلی را عوض نکند. مبلغ پایه برای سفارش‌های ۱ تا ۱۲ اسلاید یکسان است؛ به‌ازای هر اسلاید پس از اسلاید ۱۲، یک‌دهم مبلغ پایه افزوده می‌شود. مبلغ کل نهایی به تومان گرد می‌شود و سپس پیش‌پرداخت ۲۰٪ محاسبه می‌شود.

## API و جریان اطلاعات

یک Web App با `doGet` و `doPost` تمام actionها را می‌پذیرد و پاسخ `{success,data}` یا `{success:false,message}` می‌دهد.

| عمومی | دسترسی مدیریت |
| --- | --- |
| getCapabilities, getPricing, getPortfolio, getSettings | login, logout, dashboard |
| createOrder, getOrder, submitPayment, getInvoice, downloadDelivery | getOrders, updateOrderStatus, getPayments, approvePayment, rejectPayment |
| | getDeliveries, uploadDelivery, removeDelivery |
| | getCustomers, getInvoices, updatePricing, addPortfolio, updatePortfolio, deletePortfolio, updateSettings |

مشتری تعرفه و نمونه‌کار را می‌بیند، سفارش ثبت می‌کند، پس از تأیید ذخیره در Sheet شناسه و مبلغ پیش‌پرداخت را می‌گیرد، کارت‌به‌کارت می‌پردازد و شمارهٔ پیگیری را ثبت می‌کند. مدیر پرداخت را بررسی می‌کند. تأیید پرداخت، وضعیت سفارش را `confirmed` می‌کند و فاکتور یکتا می‌سازد. پیگیری و فاکتور عمومی فقط با **شمارهٔ سفارش و شمارهٔ تماس همان سفارش** برمی‌گردند. دادهٔ همهٔ مشتریان و سفارش‌ها فقط با نشست مدیریت در Apps Script قابل دریافت است.

مدیر می‌تواند در جزئیات هر سفارش چند فایل `.pptx` یا `.ppt` بارگذاری کند. فایل‌ها در پوشهٔ خصوصی Google Drive ذخیره می‌شوند و فقط شناسه و مشخصات آن‌ها در Deliveries قرار می‌گیرد. وضعیت `completed` به پرداخت تأییدشده و دست‌کم یک فایل فعال نیاز دارد. پس از تکمیل، فهرست فایل‌ها در پیگیری نمایش داده می‌شود و دریافت هر فایل با شمارهٔ سفارش و شمارهٔ موبایل بررسی می‌شود. هر فایل حداکثر ۱۰ مگابایت است. «برداشتن از تحویل» فقط نمایش فایل برای مشتری را غیرفعال می‌کند و فایل Drive را پاک نمی‌کند.

## راه‌اندازی

1. یک Spreadsheet خصوصی بسازید. از **Extensions → Apps Script**، محتوای `apps-script/Code.gs` را در پروژهٔ متصل به همان Spreadsheet قرار دهید.
2. `setupSpreadsheet()` را یک‌بار از ویرایشگر اجرا و مجوزها را تأیید کنید. تعرفه‌های اولیه و کلیدهای Settings ساخته می‌شوند.
3. در **Project Settings → Script Properties**، دو مقدار `BOOTSTRAP_ADMIN_USERNAME` و `BOOTSTRAP_ADMIN_PASSWORD` بگذارید. `setupAdmin()` را یک‌بار اجرا کنید. تابع، هش رمز را در برگهٔ `Admins` ثبت و مقادیر خام را از Script Properties حذف می‌کند.
4. در برگهٔ Settings، `card_number`، `card_holder`، `telegram_username`، `contact_phone` و `site_title` را تکمیل کنید.
5. از **Deploy → New deployment → Web app**، اجرا با حساب خودتان و دسترسی **Anyone** را انتخاب کنید. Spreadsheet را منتشر یا عمومی نکنید؛ Web App فقط actionهای مجاز را افشا می‌کند. URL انتهایی `/exec` در `assets/js/config.js` ثبت شده است؛ اگر Deployment جدیدی ساختید، مقدار آن را به‌روزرسانی کنید.
6. سایت را روی GitHub Pages منتشر کنید. یک سفارش آزمایشی، ثبت پرداخت با تاریخ شمسی، ورود مدیر، تأیید پرداخت، پیگیری و چاپ فاکتور را روی دامنهٔ نهایی آزمایش کنید.

### فعال‌سازی تحویل فایل در پروژهٔ موجود

1. `Code.gs` جدید را در همان پروژهٔ Apps Script جایگزین کنید و از ویرایشگر تابع `setupDeliveryStorage()` را یک‌بار اجرا کنید. این تابع برگهٔ Deliveries و یک پوشهٔ خصوصی «PPT Studio Deliveries» در Drive حساب اجراکننده می‌سازد؛ در اجرای نخست، مجوز دسترسی Drive را تأیید کنید. `setupAdmin()` را دوباره اجرا نکنید.
2. از **Deploy → Manage deployments → Edit → New version → Deploy** همان Web App را به‌روزرسانی کنید تا نشانی `/exec` حفظ شود.
3. فایل‌های جدید سایت را در GitHub Pages منتشر کنید. سپس در پنل، سفارش را باز کنید، فایل را بارگذاری کنید و پس از تأیید پرداخت، وضعیت را «تکمیل شده» بگذارید. با شمارهٔ سفارش و موبایل مشتری در بخش پیگیری، دکمهٔ دریافت را بررسی کنید.

## نکات عملیاتی

- مرورگر درخواست JSON را با `fetch` و `Content-Type: text/plain` به Web App می‌فرستد. پاسخ مستقیم و پاسخ نهایی پس از هدایت Google در بررسی زنده، هدر `Access-Control-Allow-Origin: *` داشتند. مسیر iframe قبلی برای این استقرار مناسب نبود، زیرا پاسخ Google با `X-Frame-Options: SAMEORIGIN` و `frame-ancestors self` اجازهٔ جاسازی را نمی‌داد. روی دامنهٔ نهایی GitHub Pages ورود و جریان سفارش را آزمایش کنید.
- اطلاعات ورود در کد عمومی نیست. رمز با salt و SHA-256 در Sheet ذخیره می‌شود. نشست‌ها در `CacheService` شش ساعت اعتبار دارند. برای محیطی با ترافیک و الزامات امنیتی بالاتر، سرویس احراز هویت مستقل و محدودسازی نرخ درخواست در لبه توصیه می‌شود.
- شمارهٔ سفارش و تلفن، کلید دسترسی مشتری به جزئیات همان سفارش هستند. برای خدمات حساس‌تر، احراز هویت پیامکی یا لینک یک‌بارمصرف لازم است.
- فایل‌های تحویل نیز با همین دو داده قابل دریافت‌اند. پوشهٔ Drive را خصوصی نگه دارید؛ برای فایل‌های محرمانه، ورود با کد یک‌بارمصرف مناسب‌تر است.
- `image_url` و `preview_urls` باید URLهای مستقیم و عمومی تصویر باشند؛ تصویرها داخل Sheet آپلود نمی‌شوند.
- «ذخیره به PDF» از پنجرهٔ چاپ مرورگر انجام می‌شود.

## طراحی واکنش‌گرا

لایهٔ `responsive.css` از موبایل شروع می‌شود: منوی لمسی، Hero با ترتیب متن ← تصویر ← دکمه‌ها، تعرفهٔ تک‌ستونه و رکوردهای برچسب‌دار در پنل. از ۷۰۰ پیکسل چیدمان تبلت و از ۱۲۰۰ پیکسل ناوبری و ساختار دسکتاپ فعال می‌شود. تعرفه‌ها در موبایل، تبلت و دسکتاپ به ترتیب ۱، ۲ و ۴ ستون دارند. جداشدن تصویرها و عناصر تزئینی در محدودهٔ خودشان انجام شده و از `overflow-x: hidden` برای کل صفحه استفاده نشده است.

اندازه‌های ۳۲۰، ۳۶۰، ۳۷۵، ۳۹۰، ۴۱۴، ۷۶۸، ۸۲۰، ۱۰۲۴، ۱۲۸۰، ۱۳۶۶، ۱۴۴۰، ۱۵۳۶ و ۱۹۲۰ پیکسل از نظر محاسبهٔ عرض Container، ستون‌های تعرفه و فضای جدول پنل بررسی شده‌اند. آزمون تصویری در مرورگر روی دامنهٔ نهایی هنوز لازم است.

## تغییرات تعرفه، تاریخ و تأیید ثبت

- قیمت هر تعرفه برای ۱۰ تا ۱۲ اسلاید است. برای کمتر از ۱۰ اسلاید نیز همان حداقل مبلغ پایه محاسبه می‌شود. برای `n > 12`، مبلغ کل برابر است با `round(base × (1 + (n - 12) / 10))`. فرانت‌اند فقط پیش‌نمایش محاسبه را نشان می‌دهد؛ مبلغ معتبر در Apps Script از تعرفهٔ فعال Sheet محاسبه و در Orders ثبت می‌شود.
- تاریخ واریز در فرم به‌شکل شمسی `YYYY/MM/DD` یا هشت رقم پشت‌سرهم وارد و در Payments به‌صورت متن `YYYY/MM/DD` ذخیره می‌شود. ارقام فارسی پذیرفته و به قالب یکنواخت تبدیل می‌شوند. برای سازگاری با نسخهٔ قبلی فرم، API تاریخ میلادی `YYYY-MM-DD` را نیز به شمسی تبدیل می‌کند.
- `createOrder` پس از نوشتن سفارش، `SpreadsheetApp.flush()` و بازخوانی ردیف را انجام می‌دهد. سایت پس از پاسخ موفق، با `getOrder` همان سفارش را دوباره بررسی می‌کند و فقط سپس مرحلهٔ پرداخت را باز می‌کند. اگر بازخوانی دوم قطع شود، شمارهٔ سفارش و دکمهٔ تأیید دوباره نمایش داده می‌شود.
- `submitPayment` نیز پس از ذخیرهٔ تاریخ و شماره پیگیری، ردیف Payments را بازخوانی می‌کند.
- شمارهٔ موبایل در برگه‌های Orders و Customers به‌صورت متن ذخیره می‌شود. اگر Google Sheets در سفارش‌های قبلی صفر اول شماره را حذف کرده باشد، API هنگام پیگیری و ثبت پرداخت آن شماره را اصلاح و با شمارهٔ واردشده تطبیق می‌دهد.

## انتشار این نسخه روی سرویس فعلی

1. فایل `apps-script/Code.gs` را در پروژهٔ Apps Script فعلی جایگزین کنید.
2. `setupDeliveryStorage()` را یک‌بار از ویرایشگر اجرا و مجوز Drive را تأیید کنید. این کار برگهٔ Deliveries را به همان Spreadsheet اضافه می‌کند؛ Spreadsheet تازه لازم نیست.
3. از **Deploy → Manage deployments → Edit → New version → Deploy** نسخهٔ جدید همان Web App را منتشر کنید تا URL فعلی حفظ شود.
4. فایل‌های Frontend به‌روز را در مخزن GitHub Pages قرار دهید. سایت با `getCapabilities` نسخهٔ API و قابلیت تحویل فایل را بررسی می‌کند و تا زمان انتشار **هر دو سمت** ثبت سفارش را غیرفعال نگه می‌دارد؛ API نیز سفارش‌های فرستاده‌شده از نسخهٔ قدیمی سایت را رد می‌کند تا مبلغ اشتباه ثبت نشود.
5. سفارش ۱۰، ۱۲ و ۱۳ اسلایدی را با یک تعرفه آزمایش کنید؛ سفارش ۱۳ اسلایدی باید ۱۰٪ بیشتر از مبلغ پایه شود. سپس یک پرداخت با تاریخ شمسی ثبت و وجود ردیف‌ها را در Orders و Payments بررسی کنید. یک فایل آزمایشی نیز بارگذاری و پس از «تکمیل شده» کردن سفارش از بخش پیگیری دریافت کنید.

## وضعیت اتصال فعلی

نشانی Web App ارائه‌شده در `assets/js/config.js` ثبت شده است. در بررسی قبلی، API چهار تعرفه فعال برگرداند و درخواست مدیریت بدون نشست را رد کرد. هنگام آن بررسی، شمارهٔ کارت و نام صاحب کارت خالی بودند؛ تا تکمیل آن‌ها، ثبت سفارش در سایت غیرفعال می‌ماند. عملیات نوشتنی روی Sheet واقعی بدون سفارش آزمایشی انجام نشده است.
