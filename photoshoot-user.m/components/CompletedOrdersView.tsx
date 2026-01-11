
import React, { useState, useEffect } from 'react';
import { Firestore, collection, onSnapshot, query, where, limit } from 'firebase/firestore';
import { Order } from '../types.ts';

const CompletedOrdersView: React.FC<any> = ({ db, onOpenOrder }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'requests'), where('status', '==', 'مكتملة'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const list: Order[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Order));
      list.sort((a, b) => (b.finishedAt?.seconds || 0) - (a.finishedAt?.seconds || 0));
      setOrders(list);
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  return (
    <div className="space-y-4 text-right" dir="rtl">
      <h2 className="font-black text-brown text-lg px-2">الطلبات المكتملة</h2>
      {loading ? (
        <div className="flex justify-center py-10"><i className="fa-solid fa-circle-notch fa-spin text-2xl text-brown"></i></div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {orders.map(order => (
            <button key={order.id} onClick={() => onOpenOrder(order.id)} className="bg-white p-4 rounded-mzj border border-beige shadow-sm text-right flex flex-col gap-2 opacity-80">
              <div className="flex justify-between items-center">
                <span className="font-black text-muted text-sm line-through">طلب #{order.id}</span>
                <span className="text-[10px] font-black px-2 py-1 rounded-full bg-green-100 text-green-700">مكتمل</span>
              </div>
              <div className="text-[11px] text-muted">بواسطة: {order.createdByName}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompletedOrdersView;
