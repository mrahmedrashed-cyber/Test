# MZJ Workspace System

نظام ويب داخلي متكامل لإدارة العمليات اليومية والتسويقية لمجموعة محمد بن ذعار العجمي للسيارات.

## المميزات

- نظام مصادقة وصلاحيات (Admin / Member)
- لوحة تحكم شاملة مع إحصائيات فورية
- إدارة المشاريع التشغيلية والتسويقية
- متابعة شاملة للسيارات مع فلاتر متقدمة
- نظام الميديا والتصوير مع تتبع دقيق
- إدارة الأعضاء والصلاحيات
- إدارة الحملات التسويقية
- الوايت بورد التفاعلي (قيد التطوير)

## التقنيات المستخدمة

- HTML5
- CSS3
- Vanilla JavaScript
- Firebase Authentication
- Firebase Firestore
- خط Tajawal
- RTL Layout

## إعداد المشروع

### 1. إعداد Firebase

1. قم بإنشاء مشروع جديد في [Firebase Console](https://console.firebase.google.com)
2. فعّل Firebase Authentication (Email/Password)
3. أنشئ قاعدة بيانات Firestore
4. احصل على بيانات التكوين من إعدادات المشروع

### 2. تحديث التكوين

افتح ملف `scripts/firebase-config.js` وحدّث القيم:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
}
```

### 3. إنشاء أول مستخدم Admin

في Firebase Console:
1. اذهب إلى Authentication
2. أضف مستخدماً جديداً بالبريد وكلمة المرور
3. انسخ الـ UID الخاص به
4. اذهب إلى Firestore
5. أنشئ collection باسم `users`
6. أضف document بالـ UID المنسوخ:

```json
{
  "name": "اسم المستخدم",
  "email": "email@example.com",
  "role": "admin",
  "color": "#bc8f74",
  "active": true,
  "createdAt": [timestamp]
}
```

### 4. تشغيل النظام

افتح `index.html` في المتصفح، أو ارفع الملفات على استضافة ويب.

## هيكل قاعدة البيانات

### users
```
{
  uid: {
    name: string,
    email: string,
    role: "admin" | "member",
    color: string,
    active: boolean,
    createdAt: timestamp
  }
}
```

### projects
```
{
  id: {
    title: string,
    status: "pending" | "in-progress" | "completed",
    assignedTo: string,
    createdAt: timestamp,
    createdBy: string
  }
}
```

### cars
```
{
  vin: {
    name: string,
    model: string,
    year: number,
    extColor: string,
    intColor: string,
    status: string,
    photoshoot: boolean,
    montage: boolean,
    notes: string,
    updatedAt: timestamp
  }
}
```

### campaigns
```
{
  id: {
    title: string,
    type: "social" | "email" | "sms" | "event",
    status: "draft" | "scheduled" | "active" | "completed",
    startDate: string,
    endDate: string,
    description: string,
    createdAt: timestamp
  }
}
```

## الصلاحيات

| الصفحة | Admin | Member |
|--------|-------|--------|
| Dashboard | ✅ | ❌ |
| Projects | ✅ (كامل) | ✅ (عرض فقط) |
| Cars | ✅ | ❌ |
| Media | ✅ | ❌ |
| Members | ✅ | ❌ |
| Campaigns | ✅ | ❌ |
| Whiteboard | ✅ | ✅ |

## ملاحظات مهمة

- جميع البيانات محفوظة في Firestore (لا يوجد localStorage)
- التعديلات تُحفظ مباشرة دون إعادة تحميل الصفحة
- النظام responsive ويدعم الجوال والديسكتوب
- جميع النصوص باللغة العربية مع RTL layout

## الدعم

للمساعدة أو الإبلاغ عن مشاكل، يرجى التواصل مع فريق التطوير.

---

© 2025 MZJ Group - All Rights Reserved
