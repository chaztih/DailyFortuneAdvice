/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  History as HistoryIcon, 
  Heart, 
  LogOut, 
  User as UserIcon, 
  RefreshCw, 
  ChevronLeft,
  Trash2,
  Download
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { FORTUNES, LUCKY_COLORS, ADVICES } from './constants';
import { FortuneRecord, User } from './types';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<FortuneRecord[]>([]);
  const [view, setView] = useState<'home' | 'draw' | 'result' | 'history' | 'donate'>('home');
  const [currentFortune, setCurrentFortune] = useState<FortuneRecord | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load data from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('fortune_user');
    const savedRecords = localStorage.getItem('fortune_records');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedRecords) setRecords(JSON.parse(savedRecords));
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (user) localStorage.setItem('fortune_user', JSON.stringify(user));
    else localStorage.removeItem('fortune_user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('fortune_records', JSON.stringify(records));
  }, [records]);

  const handleLogin = (username: string) => {
    setUser({ username, isLoggedIn: true });
  };

  const handleLogout = () => {
    setUser(null);
    setView('home');
  };

  const drawFortune = () => {
    const randomFortune = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
    const randomColor = LUCKY_COLORS[Math.floor(Math.random() * LUCKY_COLORS.length)];
    const randomAdvice = ADVICES[Math.floor(Math.random() * ADVICES.length)];

    const newRecord: FortuneRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      fortune: randomFortune,
      luckyColor: randomColor.name,
      luckyColorHex: randomColor.hex,
      advice: randomAdvice,
    };

    setCurrentFortune(newRecord);
    setView('result');
  };

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("無法存取相機，請檢查權限。");
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && currentFortune) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photoData = canvas.toDataURL('image/jpeg');
        
        const updatedFortune = { ...currentFortune, photo: photoData };
        setCurrentFortune(updatedFortune);
        setRecords(prev => [updatedFortune, ...prev]);
        stopCamera();
      }
    }
  };

  const skipPhoto = () => {
    if (currentFortune) {
      setRecords(prev => [currentFortune, ...prev]);
      setView('history');
    }
  };

  const deleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#1A1A1A] font-serif selection:bg-[#5A5A40] selection:text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-[#1A1A1A]/10 z-50 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight cursor-pointer" onClick={() => setView('home')}>
          今日建議 <span className="font-light italic text-sm opacity-60">Daily Advice</span>
        </h1>
        <div className="flex items-center gap-4">
          <button onClick={() => setView('history')} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <HistoryIcon size={20} />
          </button>
          <button onClick={() => setView('donate')} className="p-2 hover:bg-black/5 rounded-full transition-colors text-red-500">
            <Heart size={20} />
          </button>
          <button onClick={handleLogout} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-12 py-12"
            >
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.2em] opacity-50">Welcome, {user.username}</p>
                <h2 className="text-5xl font-light leading-tight">
                  探尋今日的<br />
                  <span className="italic">命運與色彩</span>
                </h2>
              </div>

              <div className="relative group cursor-pointer inline-block" onClick={() => setView('draw')}>
                <div className="absolute inset-0 bg-[#5A5A40] rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative w-48 h-48 rounded-full border border-[#1A1A1A]/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                  <div className="text-center">
                    <RefreshCw className="mx-auto mb-2 opacity-40 group-hover:rotate-180 transition-transform duration-700" size={32} />
                    <span className="text-sm font-medium tracking-widest uppercase">立即抽籤</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'draw' && (
            <motion.div
              key="draw"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
            >
              <div className="w-full max-w-xs aspect-[3/4] bg-white rounded-3xl shadow-2xl border border-[#1A1A1A]/5 flex flex-col items-center justify-center p-8 space-y-6">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#1A1A1A]/20 animate-spin-slow flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#5A5A40]/10"></div>
                </div>
                <p className="text-lg italic opacity-60">正在為您感應今日氣場...</p>
                <button 
                  onClick={drawFortune}
                  className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-medium tracking-widest uppercase hover:bg-[#5A5A40] transition-colors"
                >
                  揭曉結果
                </button>
              </div>
              <button onClick={() => setView('home')} className="text-sm opacity-40 hover:opacity-100 transition-opacity flex items-center gap-2">
                <ChevronLeft size={16} /> 返回首頁
              </button>
            </motion.div>
          )}

          {view === 'result' && currentFortune && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-[#1A1A1A]/5 space-y-8">
                <div className="text-center space-y-2">
                  <p className="text-xs uppercase tracking-widest opacity-40">{format(new Date(currentFortune.date), 'yyyy.MM.dd')}</p>
                  <h3 className="text-4xl font-bold">{currentFortune.fortune}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-2xl bg-[#F9F9F7] border border-[#1A1A1A]/5 flex flex-col items-center justify-center space-y-3">
                    <span className="text-[10px] uppercase tracking-widest opacity-40">今日幸運色</span>
                    <div 
                      className="w-12 h-12 rounded-full shadow-inner" 
                      style={{ backgroundColor: currentFortune.luckyColorHex }}
                    ></div>
                    <span className="text-sm font-medium">{currentFortune.luckyColor}</span>
                  </div>
                  <div className="p-6 rounded-2xl bg-[#F9F9F7] border border-[#1A1A1A]/5 flex flex-col items-center justify-center space-y-3">
                    <span className="text-[10px] uppercase tracking-widest opacity-40">建議</span>
                    <p className="text-xs text-center leading-relaxed">{currentFortune.advice}</p>
                  </div>
                </div>

                {currentFortune.photo ? (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-[#1A1A1A]/10">
                    <img src={currentFortune.photo} alt="Record" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-4">
                      <p className="text-white text-xs italic opacity-80">已記錄此刻的心情</p>
                    </div>
                  </div>
                ) : isCapturing ? (
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                      <button onClick={capturePhoto} className="p-4 bg-white rounded-full shadow-lg hover:scale-110 transition-transform">
                        <Camera size={24} />
                      </button>
                      <button onClick={stopCamera} className="p-4 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-colors">
                        <ChevronLeft size={24} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={startCamera}
                      className="w-full py-4 border-2 border-dashed border-[#1A1A1A]/20 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#F9F9F7] transition-colors"
                    >
                      <Camera size={20} className="opacity-40" />
                      <span className="text-sm font-medium opacity-60">拍照記錄今日</span>
                    </button>
                    <button 
                      onClick={skipPhoto}
                      className="w-full py-3 text-sm opacity-40 hover:opacity-100 transition-opacity"
                    >
                      暫不記錄，直接完成
                    </button>
                  </div>
                )}

                {currentFortune.photo && (
                  <button 
                    onClick={() => setView('history')}
                    className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-medium tracking-widest uppercase hover:bg-[#5A5A40] transition-colors"
                  >
                    查看歷史記錄
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <h3 className="text-3xl font-light">歷史記錄 <span className="italic opacity-40 text-lg">History</span></h3>
                <p className="text-xs opacity-40">{records.length} 則記錄</p>
              </div>

              <div className="space-y-4">
                {records.length === 0 ? (
                  <div className="py-24 text-center space-y-4 opacity-30">
                    <HistoryIcon size={48} className="mx-auto" />
                    <p>尚無任何記錄</p>
                  </div>
                ) : (
                  records.map((record) => (
                    <motion.div 
                      layout
                      key={record.id}
                      className="bg-white rounded-2xl p-4 border border-[#1A1A1A]/5 flex gap-4 items-start group"
                    >
                      {record.photo ? (
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-[#1A1A1A]/5">
                          <img src={record.photo} alt="Record" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-[#F9F9F7] flex-shrink-0 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full" style={{ backgroundColor: record.luckyColorHex }}></div>
                        </div>
                      )}
                      <div className="flex-grow space-y-1">
                        <div className="flex justify-between items-start">
                          <p className="text-[10px] uppercase tracking-widest opacity-40">{format(new Date(record.date), 'MMM dd, yyyy')}</p>
                          <button onClick={() => deleteRecord(record.id)} className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <h4 className="font-bold">{record.fortune}</h4>
                        <p className="text-xs opacity-60 line-clamp-1">{record.advice}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
              <button onClick={() => setView('home')} className="w-full py-4 border border-[#1A1A1A]/10 rounded-2xl text-sm font-medium hover:bg-white transition-colors">
                返回首頁
              </button>
            </motion.div>
          )}

          {view === 'donate' && (
            <motion.div
              key="donate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 text-center py-12"
            >
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="text-red-500" size={40} fill="currentColor" />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-light">支持我們</h3>
                <p className="text-sm opacity-60 leading-relaxed max-w-xs mx-auto">
                  如果您喜歡這個小工具，歡迎透過 Google Play 贊助我們，讓我們能持續開發更多有趣的功能。
                </p>
              </div>

              <div className="grid gap-4 max-w-xs mx-auto">
                {[
                  { amount: 'NT$ 30', label: '一杯咖啡' },
                  { amount: 'NT$ 150', label: '一份午餐' },
                  { amount: 'NT$ 500', label: '巨大的支持' }
                ].map((item) => (
                  <button 
                    key={item.amount}
                    className="p-6 bg-white rounded-2xl border border-[#1A1A1A]/5 hover:border-red-500/20 hover:bg-red-50/30 transition-all group flex justify-between items-center"
                    onClick={() => alert(`正在導向 Google Play 支付介面 (${item.amount})...`)}
                  >
                    <div className="text-left">
                      <p className="text-xs opacity-40 uppercase tracking-widest">{item.label}</p>
                      <p className="text-xl font-bold">{item.amount}</p>
                    </div>
                    <Download className="opacity-0 group-hover:opacity-40 transition-opacity" size={20} />
                  </button>
                ))}
              </div>

              <button onClick={() => setView('home')} className="text-sm opacity-40 hover:opacity-100 transition-opacity">
                返回首頁
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: (username: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] flex items-center justify-center p-6 font-serif">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl border border-[#1A1A1A]/5 space-y-10"
      >
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-[#5A5A40] rounded-2xl rotate-12 mx-auto mb-6 flex items-center justify-center shadow-lg">
            <UserIcon className="text-white -rotate-12" size={32} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">登入帳號</h2>
          <p className="text-sm opacity-40 italic">開啟您的每日命運之旅</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest opacity-40 ml-4">使用者名稱</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="您的名字"
                className="w-full px-6 py-4 bg-[#F9F9F7] rounded-2xl border border-transparent focus:border-[#5A5A40]/20 focus:bg-white transition-all outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest opacity-40 ml-4">密碼 (選填)</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-[#F9F9F7] rounded-2xl border border-transparent focus:border-[#5A5A40]/20 focus:bg-white transition-all outline-none"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-5 bg-[#1A1A1A] text-white rounded-2xl font-medium tracking-[0.2em] uppercase hover:bg-[#5A5A40] transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            進入平台
          </button>
        </form>

        <p className="text-center text-[10px] opacity-20 uppercase tracking-widest">
          No Backend Required • Local Storage Only
        </p>
      </motion.div>
    </div>
  );
}
