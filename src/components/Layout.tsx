import React from 'react';
import { UserProfile } from '../types';
import { LogOut, User as UserIcon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: UserProfile | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center space-x-3 sm:space-x-5">
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-primary-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl shadow-primary-900/20">
                 <div className="text-white font-black text-lg sm:text-xl italic">A</div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-[16px] sm:text-[20px] font-black text-slate-900 tracking-tight leading-none uppercase">
                  StaffFlow <span className="text-primary-600">Pro</span>
                </h1>
                <span className="text-[8px] sm:text-[9px] font-black tracking-[0.2em] uppercase text-primary-500 mt-1 sm:mt-1.5 flex items-center gap-1.5 sm:gap-2">
                   <div className="w-1 h-1 rounded-full bg-primary-500 animate-pulse" />
                   <span className="truncate max-w-[120px] sm:max-w-none">
                     {user?.role === 'manager' ? '통합 운영 제어 센터' : '표준 업무 관리 데스크'}
                   </span>
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-8">
              {user && (
                <div className="flex items-center space-x-3 sm:space-x-4 pl-3 sm:pl-8 border-l border-slate-100">
                  <div className="hidden xs:flex text-right flex flex-col justify-center">
                    <p className="text-[11px] sm:text-[12px] font-black text-slate-900 leading-none truncate max-w-[80px] sm:max-w-none">
                      {user.displayName || user.email.split('@')[0]}
                    </p>
                    <p className="text-[8px] sm:text-[9px] text-primary-500 font-black uppercase tracking-widest mt-0.5 sm:mt-1">
                      {user.role === 'manager' ? '운영 관리자' : '현장 운영팀'}
                    </p>
                  </div>
                  <div className="w-9 h-9 sm:w-11 sm:h-11 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                    <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
                  </div>
                </div>
              )}
              
              <button
                onClick={onLogout}
                className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                title="데스크 안전 로그아웃"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            &copy; 2026 StaffFlow Pro • 운영 관리 인프라
          </p>
          <div className="flex gap-6">
            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> 시스템 정상 작동 중
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
