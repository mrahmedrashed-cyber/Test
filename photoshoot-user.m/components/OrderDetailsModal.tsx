
import React, { useState, useEffect } from 'react';
import { Firestore, collection, doc, onSnapshot, updateDoc, writeBatch, serverTimestamp, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Order, OrderRow, UserProfile } from '../types';
import { ROLE_ADMIN, ROLE_IDARI } from '../constants';

interface OrderDetailsModalProps {
  orderId: string;
  db: Firestore;
  currentUser: User;
  userProfile: UserProfile | null;
  onClose: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ orderId, db, currentUser, userProfile, onClose }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reqRef = doc(db, 'requests', orderId);
    const unsubReq = onSnapshot(reqRef, (snap) => {
      if (snap.exists()) setOrder({ id: snap.id, ...snap.data() } as Order);
    });
    const unsubRows = onSnapshot(collection(reqRef, 'rows'), (snap) => {
      const list: OrderRow[] = [];
      snap.forEach(d => list.push({ ...d.data() } as OrderRow));
      setRows(list.sort((a,b) => a.vin.localeCompare(b.vin)));
      setLoading(false);
    });
    return () => { unsubReq(); unsubRows(); };
  }, [db, orderId]);

  const canDoStep = (row: OrderRow, stepNo: number) => {
    if (!userProfile) return false;
    if (userProfile.role === ROLE_ADMIN) return true;
    if (userProfile.role !== ROLE_IDARI) return false;

    const src = row.fromLocation;
    const dst = row.kind === 'shoot' ? row.shootPlace : row.toLocation;

    if (stepNo === 1 || stepNo === 2) return userProfile.locations.includes(src);
    if (stepNo === 3) {
      if (row.kind === 'move') return order?.createdByEmail === currentUser.email;
      return userProfile.locations.includes(dst || '');
    }
    return false;
  };

  const applyStep = async (stepNo: number) => {
    if (!order) return;
    const key = stepNo === 1 ? 'received' : stepNo === 2 ? 'sent' : 'carReceived';
    const targets = rows.filter(r => canDoStep(r, stepNo) && !r.steps?.[key as keyof typeof r.steps]);

    if (!targets.length) {
      alert("لا توجد سيارات مسموح لك بتنفيذ هذه المرحلة لها.");
      return;
    }

    // Verify order
    const violates = targets.some(r => {
      if (stepNo === 2) return !r.steps?.received;
      if (stepNo === 3) return !r.steps?.sent;
      return false;
    });
    if (violates) {
      alert("لا يمكن تنفيذ هذه المرحلة قبل إتمام المراحل السابقة لكل سيارة.");
      return;
    }

    const batch = writeBatch(db);
    const now = serverTimestamp();
    const stepObj = { at: now, byUid: currentUser.uid, byEmail: currentUser.email, byName: userProfile?.name || currentUser.email };

    targets.forEach(r => {
      const rowRef = doc(db, 'requests', orderId, 'rows', r.vin);
      batch.update(rowRef, { 
        [`steps.${key}`]: stepObj,
        updatedAt: now,
        ...(stepNo === 3 ? { location: (r.kind === 'shoot' ? r.shootPlace : r.toLocation) } : {})
      });
    });

    batch.update(doc(db, 'requests', orderId), { updatedAt: now });
    await batch.commit();
    alert(`تم تنفيذ المرحلة ${stepNo} لعدد ${targets.length} سيارة ✅`);
  };

  const finishRequest = async () => {
    const allDone = rows.every(r => r.steps?.carReceived);
    if (!allDone) {
      alert("يجب استلام جميع السيارات أولاً.");
      return;
    }
    if (userProfile?.role !== ROLE_ADMIN && order?.createdByEmail !== currentUser.email) {
      alert("فقط منشئ الطلب أو الإدارة يمكنهم إنهاء الطلب.");
      return;
    }

    await updateDoc(doc(db, 'requests', orderId), {
      status: 'مكتملة',
      finishedAt: serverTimestamp(),
      finishedByEmail: currentUser.email,
      finishedByName: userProfile?.name || currentUser.email,
      updatedAt: serverTimestamp()
    });
    alert("تم إنهاء الطلب بنجاح ✅");
  };

  const getProgress = () => {
    if (!rows.length) return 0;
    const s1 = rows.filter(r => r.steps?.received).length;
    const s2 = rows.filter(r => r.steps?.sent).length;
    const s3 = rows.filter(r => r.steps?.carReceived).length;
    const s4 = order?.status === 'مكتملة' ? 1 : 0;
    const totalPossible = rows.length * 3 + 1;
    const current = s1 + s2 + s3 + s4;
    return Math.round((current / totalPossible) * 100);
  };

  if (loading || !order) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-cream flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-beige p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-brown text-xl"><i className="fa-solid fa-arrow-right"></i></button>
          <div>
            <h2 className="font-black text-brown">تفاصيل الطلب #{orderId}</h2>
            <p className="text-[10px] text-muted">{order.kind === 'shoot' ? 'تصوير' : (order.kind === 'move' ? 'نقل' : 'مختلط')} — {order.status}</p>
          </div>
        </div>
      </header>

      {/* Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {/* Progress Card */}
        <div className="bg-white p-4 rounded-mzj border border-beige shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-black text-brown">إنجاز الطلب</span>
            <span className="text-xs font-black text-muted">{getProgress()}%</span>
          </div>
          <div className="h-2 bg-cream rounded-full overflow-hidden border border-beige">
            <div className="h-full bg-brown transition-all duration-500" style={{ width: `${getProgress()}%` }}></div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className={`p-2 rounded-mzj border text-center ${rows.every(r => r.steps?.received) ? 'bg-green-50 border-green-200' : 'bg-cream border-beige'}`}>
              <div className="text-[9px] font-bold text-muted">1. استلام الطلب</div>
              <div className="text-[11px] font-black text-brown">{rows.filter(r => r.steps?.received).length}/{rows.length}</div>
            </div>
            <div className={`p-2 rounded-mzj border text-center ${rows.every(r => r.steps?.sent) ? 'bg-green-50 border-green-200' : 'bg-cream border-beige'}`}>
              <div className="text-[9px] font-bold text-muted">2. إرسال السيارة</div>
              <div className="text-[11px] font-black text-brown">{rows.filter(r => r.steps?.sent).length}/{rows.length}</div>
            </div>
            <div className={`p-2 rounded-mzj border text-center ${rows.every(r => r.steps?.carReceived) ? 'bg-green-50 border-green-200' : 'bg-cream border-beige'}`}>
              <div className="text-[9px] font-bold text-muted">3. استلام السيارة</div>
              <div className="text-[11px] font-black text-brown">{rows.filter(r => r.steps?.carReceived).length}/{rows.length}</div>
            </div>
            <div className={`p-2 rounded-mzj border text-center ${order.status === 'مكتملة' ? 'bg-green-50 border-green-200' : 'bg-cream border-beige'}`}>
              <div className="text-[9px] font-bold text-muted">4. الإنهاء</div>
              <div className="text-[11px] font-black text-brown">{order.status === 'مكتملة' ? 'نعم' : 'لا'}</div>
            </div>
          </div>
        </div>

        {/* VIN Portrait Cards */}
        <h3 className="font-black text-brown text-sm border-r-4 border-brown pr-2">السيارات ({rows.length})</h3>
        {rows.map((row, idx) => {
          const nextStep = !row.steps?.received ? 1 : !row.steps?.sent ? 2 : !row.steps?.carReceived ? 3 : 0;
          const myTurn = nextStep ? canDoStep(row, nextStep) : false;
          
          return (
            <div key={idx} className={`bg-white rounded-mzj border shadow-sm overflow-hidden ${myTurn ? 'border-brown ring-1 ring-brown/20' : 'border-beige'}`}>
              <div className={`px-4 py-2 border-b flex justify-between items-center ${myTurn ? 'bg-brown/5 border-brown/20' : 'bg-beige/10 border-beige'}`}>
                <span className="font-mono text-xs font-black text-brown">{row.vin}</span>
                {myTurn && <span className="text-[9px] bg-brown text-white px-2 py-0.5 rounded-full font-black animate-pulse">دورك الآن</span>}
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-[10px] text-muted">السيارة:</span>
                  <span className="text-[10px] font-bold text-brown">{row.car} {row.variant}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-muted">المصدر:</span>
                  <span className="text-[10px] font-bold text-brown">{row.fromLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-muted">الوجهة:</span>
                  <span className="text-[10px] font-bold text-brown">{row.kind === 'shoot' ? row.shootPlace : row.toLocation}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-beige/50">
                  <span className="text-[10px] text-muted">المرحلة الحالية:</span>
                  <span className="text-[10px] font-black py-1 px-3 bg-cream border border-beige rounded-mzj">
                    {!row.steps?.received ? 'بانتظار الاستلام' : !row.steps?.sent ? 'تم الاستلام - بانتظار الإرسال' : !row.steps?.carReceived ? 'تم الإرسال - بانتظار الوصول' : 'مكتملة'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Tray */}
      <footer className="fixed bottom-0 inset-x-0 bg-white border-t border-beige p-4 shadow-xl z-50 grid grid-cols-2 gap-2">
        <button 
          onClick={() => applyStep(1)}
          className="bg-brown text-white text-[11px] font-black py-3 rounded-mzj shadow-sm flex flex-col items-center justify-center leading-tight active:scale-95"
        >
          <span>1. تم استلام الطلب</span>
        </button>
        <button 
          onClick={() => applyStep(2)}
          className="bg-brown text-white text-[11px] font-black py-3 rounded-mzj shadow-sm flex flex-col items-center justify-center leading-tight active:scale-95"
        >
          <span>2. تم إرسال السيارة</span>
        </button>
        <button 
          onClick={() => applyStep(3)}
          className="bg-brown text-white text-[11px] font-black py-3 rounded-mzj shadow-sm flex flex-col items-center justify-center leading-tight active:scale-95"
        >
          <span>3. تم استلام السيارة</span>
        </button>
        <button 
          onClick={finishRequest}
          className="bg-ok text-white text-[11px] font-black py-3 rounded-mzj shadow-sm flex flex-col items-center justify-center leading-tight active:scale-95"
        >
          <span>4. إنهاء الطلب</span>
        </button>
      </footer>
    </div>
  );
};

export default OrderDetailsModal;
