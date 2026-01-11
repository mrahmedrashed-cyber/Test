
import React, { useState } from 'react';
import { Firestore, collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { StockItem, UserProfile, OrderRow } from '../types';
import { SHOOT_PLACES, ROLE_ADMIN, ROLE_IDARI, SHOOT_ALLOWED_EMAIL } from '../constants';

interface OrderCreationViewProps {
  db: Firestore;
  currentUser: User;
  userProfile: UserProfile | null;
  stock: StockItem[];
  onOrderCreated: () => void;
}

const OrderCreationView: React.FC<OrderCreationViewProps> = ({ db, currentUser, userProfile, stock, onOrderCreated }) => {
  const [rows, setRows] = useState<Partial<OrderRow>[]>([{ kind: 'shoot', vin: '', car: '', note: '' }]);
  const [submitting, setSubmitting] = useState(false);

  const canCreateShoot = () => userProfile?.role === ROLE_ADMIN || currentUser.email === SHOOT_ALLOWED_EMAIL;

  const handleVinBlur = (idx: number, vin: string) => {
    const cleanVin = vin.trim().toUpperCase().replace(/\s+/g, '');
    const updatedRows = [...rows];
    updatedRows[idx].vin = cleanVin;

    const matched = stock.find(s => s.vin.trim().toUpperCase() === cleanVin);
    if (matched) {
      updatedRows[idx] = {
        ...updatedRows[idx],
        car: matched.car,
        variant: matched.variant,
        extColor: matched.extColor,
        intColor: matched.intColor,
        modelYear: matched.modelYear,
        fromLocation: matched.location,
        location: matched.location
      };
    }
    setRows(updatedRows);
  };

  const updateRow = (idx: number, field: keyof OrderRow, value: any) => {
    const updatedRows = [...rows];
    updatedRows[idx] = { ...updatedRows[idx], [field]: value };
    setRows(updatedRows);
  };

  const addRow = () => {
    setRows([...rows, { kind: canCreateShoot() ? 'shoot' : 'move', vin: '', note: '' }]);
  };

  const removeRow = (idx: number) => {
    if (rows.length === 1) {
      setRows([{ kind: canCreateShoot() ? 'shoot' : 'move', vin: '', note: '' }]);
    } else {
      setRows(rows.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = async () => {
    const validRows = rows.filter(r => r.vin && (r.kind === 'shoot' ? r.shootPlace : r.toLocation));
    if (!validRows.length) {
      alert("الرجاء ملء بيانات السيارة والمكان بشكل كامل.");
      return;
    }

    setSubmitting(true);
    try {
      const kinds = Array.from(new Set(validRows.map(r => r.kind)));
      const finalKind = kinds.length > 1 ? 'mixed' : kinds[0] as any;

      const orderRef = await addDoc(collection(db, 'requests'), {
        kind: finalKind,
        status: 'تحت المتابعة',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdByUid: currentUser.uid,
        createdByEmail: currentUser.email,
        createdByName: userProfile?.name || currentUser.displayName || currentUser.email,
        total: validRows.length
      });

      const batch = writeBatch(db);
      validRows.forEach((r) => {
        const rowRef = doc(collection(orderRef, 'rows'), r.vin!);
        batch.set(rowRef, {
          ...r,
          steps: {},
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      });
      await batch.commit();
      
      alert("تم إرسال الطلب بنجاح ✅");
      onOrderCreated();
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء إرسال الطلب.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-mzj border border-beige shadow-sm">
        <h2 className="font-black text-brown text-lg mb-2">إنشاء طلب جديد</h2>
        <p className="text-xs text-muted">قم بإضافة السيارات وإدخال الـ VIN وسيتم تعبئة البيانات تلقائياً من المخزون.</p>
      </div>

      {rows.map((row, idx) => (
        <div key={idx} className="bg-white rounded-mzj border border-beige shadow-sm overflow-hidden relative">
          <div className="bg-beige/30 px-4 py-2 flex justify-between items-center border-b border-beige">
            <span className="font-black text-brown text-sm">سيارة #{idx + 1}</span>
            <button onClick={() => removeRow(idx)} className="text-warn p-1"><i className="fa-solid fa-circle-xmark"></i></button>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-1">
                <label className="text-[10px] font-bold text-muted block mb-1">النوع</label>
                <select 
                  className="w-full text-xs p-2 bg-cream rounded-mzj border border-beige"
                  value={row.kind}
                  onChange={(e) => updateRow(idx, 'kind', e.target.value)}
                >
                  {canCreateShoot() && <option value="shoot">تصوير</option>}
                  <option value="move">نقل</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-bold text-muted block mb-1">VIN</label>
                <input 
                  className="w-full text-xs p-2 bg-cream rounded-mzj border border-beige font-mono"
                  placeholder="رقم الهيكل"
                  value={row.vin}
                  onChange={(e) => updateRow(idx, 'vin', e.target.value)}
                  onBlur={(e) => handleVinBlur(idx, e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted block">بيانات السيارة</label>
              <div className="p-2 bg-cream/50 rounded-mzj border border-beige text-[11px] font-bold text-brown">
                {row.car ? `${row.car} - ${row.variant}` : 'سيتم تعبئة البيانات عند كتابة VIN'}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted block">المكان الحالي</label>
              <div className="p-2 bg-cream/50 rounded-mzj border border-beige text-[11px]">
                {row.fromLocation || '—'}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted block">
                {row.kind === 'shoot' ? 'مكان التصوير' : 'وجهة النقل'}
              </label>
              <select 
                className="w-full text-xs p-2 bg-cream rounded-mzj border border-beige"
                value={row.kind === 'shoot' ? (row.shootPlace || '') : (row.toLocation || '')}
                onChange={(e) => updateRow(idx, row.kind === 'shoot' ? 'shootPlace' : 'toLocation', e.target.value)}
              >
                <option value="">— اختر الوجهة —</option>
                {SHOOT_PLACES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted block">ملاحظات إضافية</label>
              <input 
                className="w-full text-xs p-2 bg-cream rounded-mzj border border-beige"
                placeholder="ملاحظات..."
                value={row.note}
                onChange={(e) => updateRow(idx, 'note', e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}

      <div className="pt-2 pb-6 space-y-3">
        <button 
          onClick={addRow}
          className="w-full py-3 bg-white border border-beige text-brown font-black rounded-mzj flex items-center justify-center gap-2 shadow-sm"
        >
          <i className="fa-solid fa-plus-circle"></i> إضافة سيارة أخرى
        </button>
        <button 
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 bg-brown text-white font-black rounded-mzj flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
        >
          {submitting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
          إرسال الطلب ({rows.length})
        </button>
      </div>
    </div>
  );
};

export default OrderCreationView;
