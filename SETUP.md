# دليل الإعداد - MZJ Workspace System

## الخطوة 1: إعداد مشروع Firebase

### 1.1 إنشاء مشروع Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. انقر على "Add project" أو "إضافة مشروع"
3. أدخل اسم المشروع مثل "MZJ Workspace"
4. اختر الإعدادات المناسبة واستمر

### 1.2 تفعيل Authentication

1. من القائمة الجانبية، اختر **Authentication**
2. انقر على "Get started" أو "البدء"
3. اختر **Email/Password** من قائمة Sign-in methods
4. فعّل الخيار **Email/Password** (اترك Email link معطل)
5. احفظ التغييرات

### 1.3 إنشاء قاعدة بيانات Firestore

1. من القائمة الجانبية، اختر **Firestore Database**
2. انقر على "Create database" أو "إنشاء قاعدة بيانات"
3. اختر **Production mode** (للأمان)
4. اختر موقع الخادم (اختر الأقرب لك مثل `europe-west`)
5. انقر على "Enable"

### 1.4 إعداد قواعد الأمان في Firestore

1. في صفحة Firestore Database، اذهب إلى تبويب **Rules**
2. استبدل القواعد الافتراضية بالقواعد التالية:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // السماح للمستخدمين المسجلين فقط
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. انقر على "Publish" لحفظ القواعد

### 1.5 الحصول على بيانات التكوين

1. اذهب إلى **Project Settings** (أيقونة الترس ⚙️ بجانب "Project Overview")
2. في قسم "Your apps"، انقر على أيقونة الويب `</>`
3. أدخل اسماً للتطبيق (مثل "MZJ Web App") واضغط "Register app"
4. ستظهر لك بيانات التكوين بهذا الشكل:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

5. **انسخ هذه القيم بالضبط**

---

## الخطوة 2: تحديث بيانات المشروع

### 2.1 تحديث ملف firebase-config.js

1. افتح ملف `scripts/firebase-config.js`
2. استبدل القيم الموجودة بالقيم التي حصلت عليها من Firebase Console:

```javascript
export const firebaseConfig = {
  apiKey: "قيمتك هنا",
  authDomain: "قيمتك هنا",
  projectId: "قيمتك هنا",
  storageBucket: "قيمتك هنا",
  messagingSenderId: "قيمتك هنا",
  appId: "قيمتك هنا",
}
```

3. احفظ الملف

---

## الخطوة 3: إنشاء أول مستخدم (Admin)

### 3.1 إنشاء حساب من Firebase Console

1. في Firebase Console، اذهب إلى **Authentication**
2. اختر تبويب **Users**
3. انقر على "Add user" أو "إضافة مستخدم"
4. أدخل البريد الإلكتروني وكلمة المرور (مثل: admin@mzj.com)
5. احفظ الـ **User UID** (سنحتاجه في الخطوة التالية)

### 3.2 إضافة بيانات المستخدم في Firestore

1. اذهب إلى **Firestore Database**
2. انقر على "Start collection" أو "إنشاء مجموعة"
3. أدخل اسم المجموعة: `members`
4. أنشئ أول Document بالبيانات التالية:
   - **Document ID**: استخدم نفس الـ UID من Authentication
   - **Fields** (الحقول):
     ```
     name: "Admin"
     email: "admin@mzj.com"
     role: "Admin"
     color: "#FF6B35"
     isActive: true
     createdAt: [اختر Timestamp واضغط على الساعة لتحديد الوقت الحالي]
     ```
5. احفظ الـ Document

---

## الخطوة 4: تشغيل النظام

### 4.1 فتح النظام

1. افتح ملف `index.html` في المتصفح
2. سيتم تحويلك تلقائياً إلى صفحة تسجيل الدخول

### 4.2 تسجيل الدخول

1. أدخل البريد الإلكتروني وكلمة المرور التي أنشأتها
2. انقر على "دخول"
3. إذا نجح تسجيل الدخول، سيتم تحويلك إلى Dashboard

---

## الخطوة 5: إنشاء بيانات المجموعات الأخرى (اختياري)

### 5.1 مجموعة projects

في Firestore، أنشئ مجموعة جديدة باسم `projects` (ستُنشأ تلقائياً عند إضافة أول مشروع من الواجهة)

### 5.2 مجموعة cars

أنشئ مجموعة `cars` (ستُنشأ تلقائياً عند إضافة أول سيارة)

### 5.3 مجموعة campaigns

أنشئ مجموعة `campaigns` (ستُنشأ تلقائياً عند إضافة أول حملة)

### 5.4 مجموعة whiteboard

أنشئ مجموعة `whiteboard` (ستُنشأ تلقائياً عند استخدام Whiteboard)

---

## استكشاف الأخطاء

### ❌ خطأ: "auth/api-key-not-valid"

**الحل:**
- تأكد من نسخ بيانات Firebase بشكل صحيح في `scripts/firebase-config.js`
- تأكد من عدم وجود مسافات زائدة أو أخطاء في القيم
- تحقق من أن المشروع مفعّل في Firebase Console

### ❌ خطأ: "auth/user-not-found"

**الحل:**
- تأكد من إنشاء المستخدم في Firebase Authentication
- تحقق من صحة البريد الإلكتروني وكلمة المرور

### ❌ خطأ: "Missing or insufficient permissions"

**الحل:**
- تحقق من قواعد Firestore Security Rules
- تأكد من تسجيل الدخول بنجاح
- تأكد من أن القاعدة تسمح للمستخدمين المسجلين بالقراءة والكتابة

### ❌ الصفحة فارغة أو لا تعمل

**الحل:**
- افتح Console في المتصفح (F12) وتحقق من الأخطاء
- تأكد من تحميل جميع الملفات بشكل صحيح
- تأكد من الاتصال بالإنترنت (Firebase يحتاج إلى اتصال)

---

## ملاحظات مهمة

1. **الأمان**: في الوضع الإنتاجي، قم بتحديث قواعد Firestore لتكون أكثر أماناً
2. **النسخ الاحتياطي**: قم بعمل نسخة احتياطية من البيانات بشكل دوري
3. **التحديثات**: تابع تحديثات Firebase لضمان الأمان والأداء
4. **الاستضافة**: يمكنك استضافة المشروع على Firebase Hosting أو أي خدمة أخرى

---

## الدعم

إذا واجهت أي مشاكل:
1. تحقق من Console في المتصفح (F12)
2. راجع [توثيق Firebase](https://firebase.google.com/docs)
3. تحقق من حالة خدمات Firebase في [Firebase Status](https://status.firebase.google.com/)
