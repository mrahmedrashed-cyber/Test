
import React, { useState, useEffect } from 'react';
import { Firestore, collection, onSnapshot, query, where } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Order } from '../types.ts';

const ManageOrdersView: React.FC<any> = ({ db, onOpenOrder }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'requests'), where('status', '==', 'تحت المتابعة'));
    const unsub = onSnapshot(q, (snap) => {
      const list: Order[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Order));
      list.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
      setOrders(list);
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  const getKindLabel = (k: string) => k === 'shoot' ? 'تصوير' : (k === 'move' ? 'نقل' : 'مختلط');
  const getKindColor = (k: string) => k === 'shoot' ? 'bg-blue-100 text-blue-700' : (k === 'move' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700');

  return (
    <div className="space-y-4 text-right" dir="rtl">
      <h2 className="font-black text-brown text-lg px-2">طلبات المتابعة</h2>
      {loading ? (
        <div className="flex justify-center py-10"><i className="fa-solid fa-circle-notch fa-spin text-2xl text-brown"></i></div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {orders.map(order => (
            <button key={order.id} onClick={() => onOpenOrder(order.id)} className="bg-white p-4 rounded-mzj border border-beige shadow-sm text-right flex flex-col gap-2 active:scale-[0.98]">
              <div className="flex justify-between items-center">
                <span className="font-black text-brown text-sm">طلب #{order.id}</span>
                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${getKindColor(order.kind)}`}>{getKindLabel(order.kind)}</span>
              </div>
              <div className="text-[11px] text-muted">{order.createdByName} • {order.total} سيارات</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageOrdersView;
