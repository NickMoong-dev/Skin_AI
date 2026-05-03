import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User
} from 'firebase/auth';
import { auth } from './lib/firebase';
import { UserProfile, Category } from './types';
import { storageService } from './services/storageService';
import StaffDashboard from './components/StaffDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import { Layout } from './components/Layout';
import { LogIn, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ADMIN_EMAILS = ['dkelwprnr@gmail.com'];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Login states
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const existingProfile = await storageService.getUserProfile(firebaseUser.uid);
        if (existingProfile) {
          setProfile(existingProfile);
          setLoading(false);
        } else {
          // Keep profile null but stop initial loading to show selection screen
          setProfile(null);
          setLoading(false);
        }
      } else {
        setProfile(null);
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handleRoleSelection = async (role: 'staff' | 'manager') => {
    if (!user) return;
    setLoading(true);
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      role: role,
      displayName: user.displayName || user.email?.split('@')[0] || 'Member',
      team: role === 'manager' ? '관리팀' : '현장운영팀'
    };
    try {
      await storageService.saveUserProfile(user.uid, newProfile);
      setProfile(newProfile);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setLoginError('프로필 생성 실패. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      const unsubscribeCats = storageService.subscribeToCategories((data) => {
        if (data.length === 0 && profile.role === 'manager') {
          // Initialize defaults if none exist and is manager
          initializeDefaultCategories();
        } else {
          setCategories(data);
        }
      });
      return () => unsubscribeCats();
    }
  }, [profile]);

  const initializeDefaultCategories = async () => {
    const defaults = [
      { zone: '고객 접점 구역', name: '리셉션 데스크', areas: ['메인 인포', '상담 부스', '라운지'], defaultChecklist: ['데스크 정리상태', '대기공간 청결도', '정렬 상태'], order: 1 },
      { zone: '행정 지원 구역', name: '사무 관리실', areas: ['업무 지원석', '문서 보관함'], defaultChecklist: ['서류 정리상태', '집기류 배치', '공용 비품 잔여량'], order: 2 },
      { zone: '물류 관리 구역', name: '약제/비품실', areas: ['중앙 비품실', '약제실'], defaultChecklist: ['재고 기록 일치 여부', '물품 유효기간 확인', '정리 정돈'], order: 3 },
      { zone: '환경 위생 구역', name: '공용부 관리', areas: ['메인 복도', '대기 로비'], defaultChecklist: ['조명 작동 여부', '쾌적도 상태', '시설물 파손 여부'], order: 4 },
      { zone: '인력 운영 구역', name: '표준 용모 관리', areas: ['출근 체크', '정기 복장 검사'], defaultChecklist: ['직무 복장 준수', 'ID 카드 패용', '근태 체크 완료'], order: 5 },
    ];
    for (const cat of defaults) {
      await storageService.addCategory(cat as any);
    }
  };

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const googleLogin = async () => {
    if (isLoggingIn) return;
    const provider = new GoogleAuthProvider();
    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        setIsLoggingIn(false);
        return;
      }
      console.error('Login Error:', error);
      setLoginError(error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 p-12 overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 to-slate-900" />
          
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-slate-900/20 rotate-6 transition-transform hover:rotate-0 duration-500">
              <span className="text-white font-black text-3xl">P</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">StaffFlow <span className="text-primary-600">Enterprise</span></h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">프로페셔널 운영 분석 플랫폼</p>
          </div>
          
          <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-lg font-black text-slate-800">워크스페이스 로그인</h2>
              <p className="text-xs font-medium text-slate-500">공식 Google 워크스페이스 계정으로 인증하세요.</p>
            </div>

            {loginError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[11px] font-bold text-red-600 animate-pulse">
                {loginError}
              </div>
            )}

            <button
               onClick={googleLogin}
               disabled={isLoggingIn}
               className="w-full flex items-center justify-center space-x-4 bg-white border-2 border-slate-100 text-slate-700 font-black text-xs uppercase tracking-widest py-5 rounded-2xl transition-all hover:bg-slate-50 hover:border-slate-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
             >
               {isLoggingIn ? (
                 <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full" />
               ) : (
                 <>
                   <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                   <span>Google 계정으로 보안 시작</span>
                 </>
               )}
             </button>

             <div className="pt-8 text-center border-t border-slate-50">
               <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                 Authorized Personnel Only
               </p>
             </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (user && !profile && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 p-12 overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 to-slate-900" />
          
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-slate-900/20">
              <ShieldCheck className="text-white" size={40} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">프로필 설정 완료</h1>
            <p className="text-sm font-medium text-slate-500 mt-2">워크스페이스에서의 역할을 선택해 주세요.</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => handleRoleSelection('staff')}
              className="w-full flex items-center justify-between p-6 rounded-2xl border-2 border-slate-50 bg-slate-50 hover:bg-white hover:border-primary-500 transition-all group"
            >
              <div className="text-left">
                <span className="block text-sm font-black text-slate-900">운영팀 (Staff)</span>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">현장 점검 및 기록</span>
              </div>
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-primary-50">
                <LogIn size={20} className="text-slate-300 group-hover:text-primary-600" />
              </div>
            </button>

            <button
              onClick={() => handleRoleSelection('manager')}
              className="w-full flex items-center justify-between p-6 rounded-2xl border-2 border-slate-50 bg-slate-50 hover:bg-white hover:border-slate-900 transition-all group"
            >
              <div className="text-left">
                <span className="block text-sm font-black text-slate-900">관리자 (Manager)</span>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">통계 분석 및 인사이트</span>
              </div>
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-slate-900">
                <ShieldCheck size={20} className="text-slate-300 group-hover:text-white" />
              </div>
            </button>
          </div>

          <button 
            onClick={logout}
            className="w-full mt-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-red-500 transition-colors"
          >
            로그아웃 후 다시 시도
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <Layout user={profile} onLogout={logout}>
      <AnimatePresence mode="wait">
        {profile?.role === 'manager' ? (
          <ManagerDashboard key="manager" profile={profile} categories={categories} />
        ) : (
          <StaffDashboard key="staff" profile={profile} categories={categories} />
        )}
      </AnimatePresence>
    </Layout>
  );
}

