
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, getDoc } from 'firebase/firestore';
import { FIREBASE_CONFIG } from './constants.ts';

// --- Views ---
import OrderCreationView from './components/OrderCreationView.tsx';
import ManageOrdersView from './components/ManageOrdersView.tsx';
import CompletedOrdersView from './components/CompletedOrdersView.tsx';
import LoginView from './components/LoginView.tsx';
import OrderDetailsModal from './components/OrderDetailsModal.tsx';

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'done'>('create');
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setCurrentUser(user);
        const userDoc = await getDoc(doc(db, 'user', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, 'mzj_admin_state', 'v1'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStock(data.stock || []);
      }
    });
    return () => unsub();
  }, [currentUser]);

  const handleLogout = () => {
    signOut(auth);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-cream text-brown">
        <i className="fa-solid fa-circle-notch fa-spin text-4xl mb-4"></i>
        <p className="font-bold">جاري التحميل...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView auth={auth} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-cream pb-20">
      {/* Topbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-white border-b border-beige shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-brown text-white w-10 h-10 rounded-mzj flex items-center justify-center font-black text-sm">MZJ</div>
          <div className="mr-3 text-right">
            <h1 className="text-sm font-black text-brown leading-tight">Workspace Mobile</h1>
            <p className="text-[10px] text-muted">نظام إدارة الطلبات</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleLogout} className="p-2 text-brown hover:bg-cream rounded-mzj">
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
          <div className="flex items-center gap-2 px-2 py-1 bg-cream rounded-mzj border border-beige">
            <div className="w-6 h-6 rounded-full bg-brown text-white flex items-center justify-center text-[10px] font-bold">
              {userProfile?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        {activeTab === 'create' && (
          <OrderCreationView 
            db={db} 
            currentUser={currentUser} 
            userProfile={userProfile} 
            stock={stock}
            onOrderCreated={() => setActiveTab('manage')}
          />
        )}
        {activeTab === 'manage' && (
          <ManageOrdersView 
            db={db} 
            currentUser={currentUser}
            userProfile={userProfile}
            onOpenOrder={(id: string) => setSelectedOrderId(id)}
          />
        )}
        {activeTab === 'done' && (
          <CompletedOrdersView 
            db={db} 
            currentUser={currentUser}
            onOpenOrder={(id: string) => setSelectedOrderId(id)}
          />
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-beige flex justify-around items-center py-2 px-4 shadow-lg z-50">
        <button 
          onClick={() => setActiveTab('create')}
          className={`flex flex-col items-center gap-1 p-2 rounded-mzj transition-colors ${activeTab === 'create' ? 'text-brown font-bold' : 'text-muted'}`}
        >
          <i className="fa-solid fa-plus-circle text-xl"></i>
          <span className="text-[10px]">إنشاء</span>
        </button>
        <button 
          onClick={() => setActiveTab('manage')}
          className={`flex flex-col items-center gap-1 p-2 rounded-mzj transition-colors ${activeTab === 'manage' ? 'text-brown font-bold' : 'text-muted'}`}
        >
          <i className="fa-solid fa-list-check text-xl"></i>
          <span className="text-[10px]">المتابعة</span>
        </button>
        <button 
          onClick={() => setActiveTab('done')}
          className={`flex flex-col items-center gap-1 p-2 rounded-mzj transition-colors ${activeTab === 'done' ? 'text-brown font-bold' : 'text-muted'}`}
        >
          <i className="fa-solid fa-check-double text-xl"></i>
          <span className="text-[10px]">المكتملة</span>
        </button>
      </nav>

      {/* Modal View */}
      {selectedOrderId && (
        <OrderDetailsModal 
          orderId={selectedOrderId} 
          db={db} 
          currentUser={currentUser} 
          userProfile={userProfile}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
};

export default App;
