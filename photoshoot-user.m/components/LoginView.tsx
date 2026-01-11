
import React, { useState } from 'react';
import { Auth, signInWithEmailAndPassword } from 'firebase/auth';

interface LoginViewProps {
  auth: Auth;
}

const LoginView: React.FC<LoginViewProps> = ({ auth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('خطأ في الدخول: تأكد من البريد وكلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-brown">
      <div className="w-full max-w-sm space-y-8 bg-white p-8 rounded-mzj border border-beige shadow-xl">
        <div className="text-center">
          <div className="bg-brown text-white w-16 h-16 rounded-mzj mx-auto flex items-center justify-center font-black text-2xl mb-4">MZJ</div>
          <h2 className="text-2xl font-black">تسجيل الدخول</h2>
          <p className="text-muted text-sm mt-2">نظام إدارة طلبات التصوير والنقل</p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-bold mb-1">البريد الإلكتروني</label>
            <input 
              type="email" 
              className="w-full p-3 bg-cream border border-beige rounded-mzj"
              placeholder="user@mzjcars.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">كلمة المرور</label>
            <input 
              type="password" 
              className="w-full p-3 bg-cream border border-beige rounded-mzj"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="p-3 bg-warn/10 text-warn border border-warn/20 rounded-mzj text-sm font-bold">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-brown text-white font-black rounded-mzj flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-right-to-bracket"></i>}
            دخول للنظام
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginView;
