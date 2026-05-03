import React, { useState, useEffect } from 'react';
import { Category, AttendanceRecord, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ComparisonForm } from './ComparisonForm';
import { ComparisonList } from './ComparisonList';
import { Sparkles, History, Send, Clock, Play, Square, UserCheck, Activity, BarChart3 } from 'lucide-react';
import { auth } from '../lib/firebase';
import { storageService } from '../services/storageService';
import { getGradeFromScore, getGradeColor } from '../utils';
import { Comparison } from '../types';

interface StaffDashboardProps {
  profile: UserProfile;
  categories: Category[];
}

export default function StaffDashboard({ profile, categories }: StaffDashboardProps) {
  const baseZones = Array.from(new Set(categories.map(c => c.zone))).filter(Boolean) as string[];
  const hasUnzoned = categories.some(c => !c.zone);
  const zones = hasUnzoned ? [...baseZones, '기타 (미분류)'] : baseZones;
  const [activeZone, setActiveZone] = useState(zones[0] || '');
  const zoneCategories = categories.filter(c => (c.zone === activeZone) || (!c.zone && activeZone === '기타 (미분류)'));
  const [activeTab, setActiveTab] = useState(zoneCategories[0]?.id || '');
  const [view, setView] = useState<'new' | 'history' | 'stats'>('new');
  const [ownComparisons, setOwnComparisons] = useState<Comparison[]>([]);

  useEffect(() => {
    if (!profile) return;
    const unsubscribe = storageService.subscribeToStaffComparisons(profile.uid, (data) => {
      setOwnComparisons(data);
    });
    return () => unsubscribe();
  }, [profile]);

  const stats = {
    total: ownComparisons.length,
    avgScore: ownComparisons.length > 0 
      ? Math.round(ownComparisons.reduce((acc, c) => acc + (c.achievementScore || 0), 0) / ownComparisons.length)
      : 0,
    bestScore: ownComparisons.length > 0
      ? Math.max(...ownComparisons.map(c => c.achievementScore || 0))
      : 0,
    recentGrade: ownComparisons.length > 0
      ? getGradeFromScore(ownComparisons[0].achievementScore || 0)
      : '-'
  };

  useEffect(() => {
    if (activeZone && !categories.find(c => c.id === activeTab && ((c.zone === activeZone) || (!c.zone && activeZone === '기타 (미분류)')))) {
      setActiveTab(zoneCategories[0]?.id || '');
    }
  }, [activeZone, categories]);

  useEffect(() => {
    if (zones.length > 0 && !activeZone) {
      setActiveZone(zones[0]);
    }
  }, [zones]);
  const [lastRecord, setLastRecord] = useState<AttendanceRecord | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  useEffect(() => {
    fetchLastAttendance();
  }, [profile]);

  const fetchLastAttendance = async () => {
    if (!profile) return;
    try {
      const record = await storageService.fetchLastAttendance(profile.uid);
      setLastRecord(record);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleAttendance = async (type: 'clock_in' | 'clock_out') => {
    if (!profile) return;
    setLoadingAttendance(true);
    try {
      await storageService.saveAttendance({
        userId: profile.uid,
        userEmail: profile.email || '',
        userName: profile.displayName || profile.email?.split('@')[0] || 'Staff',
        type,
      });
      fetchLastAttendance();
    } catch (error) {
      console.error("Attendance failed:", error);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const isClockedIn = lastRecord?.type === 'clock_in';

  return (
    <div className="space-y-8">
      {/* Attendance Bar */}
      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
           <Activity className="w-48 h-48 rotate-12" />
        </div>
        <div className="flex items-center gap-4 sm:gap-6 relative z-10 w-full md:w-auto">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${isClockedIn ? 'bg-primary-900 border-primary-800 shadow-xl shadow-primary-900/40 text-white' : 'bg-slate-50 border border-slate-200 text-slate-300'}`}>
            <UserCheck className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {isClockedIn ? '현장 오퍼레이션 활성' : '현장 대기'}
            </h3>
            <div className="text-[9px] sm:text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isClockedIn ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />
              {lastRecord ? `상태: ${lastRecord.type === 'clock_in' ? '오퍼레이션 진행 중' : '세션 종료됨'}` : '현장 로그를 시작하세요'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
          {!isClockedIn ? (
            <button
              onClick={() => handleAttendance('clock_in')}
              disabled={loadingAttendance}
              className="flex-1 md:flex-none flex items-center justify-center space-x-3 bg-primary-900 hover:bg-primary-800 text-white px-6 sm:px-10 py-3.5 sm:py-4 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all shadow-2xl shadow-primary-900/30 active:scale-95 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
              <span>오퍼레이션 시작</span>
            </button>
          ) : (
            <button
              onClick={() => handleAttendance('clock_out')}
              disabled={loadingAttendance}
              className="flex-1 md:flex-none flex items-center justify-center space-x-3 bg-white border-2 border-red-50 hover:border-red-500 text-red-600 px-6 sm:px-10 py-3.5 sm:py-4 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all shadow-xl shadow-red-100/50 active:scale-95 disabled:opacity-50"
            >
              <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
              <span>세션 종료</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">운영 가이드</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] mt-1">현장 이미지 분석 및 SOP 품질 검증 시스템</p>
        </div>
        
        <div className="flex bg-slate-200/50 p-1 rounded-xl self-start border border-slate-200">
          <button
            onClick={() => setView('new')}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              view === 'new' ? 'bg-white text-primary-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>신규 등록</span>
          </button>
          <button
            onClick={() => setView('history')}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              view === 'history' ? 'bg-white text-primary-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>업무 기록</span>
          </button>
          <button
            onClick={() => setView('stats')}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              view === 'stats' ? 'bg-white text-primary-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>성과 분석</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'new' ? (
          <motion.div
            key="new-view"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-8"
          >
            <div className="space-y-6">
              {/* Zone Selection */}
              <div className="flex flex-wrap gap-2 px-1">
                {zones.map(zone => (
                  <button
                    key={zone}
                    onClick={() => setActiveZone(zone)}
                    className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                      activeZone === zone 
                        ? 'bg-primary-900 border-primary-900 text-white shadow-xl shadow-primary-900/20 scale-105' 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600'
                    }`}
                  >
                    {zone}
                  </button>
                ))}
              </div>

              {/* Category Selection Within Zone */}
              <div className="overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide no-scrollbar">
                <div className="flex space-x-1 inline-flex min-w-full bg-slate-100/50 p-1 rounded-2xl border border-slate-200/60">
                  {zoneCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveTab(cat.id)}
                      className={`px-6 sm:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all whitespace-nowrap ${
                        activeTab === cat.id
                          ? 'bg-white text-primary-900 shadow-md ring-1 ring-slate-200'
                          : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {categories.map((cat) => (
              activeTab === cat.id && (
                <ComparisonForm key={cat.id} profile={profile} category={cat} onComplete={() => setView('history')} />
              )
            ))}
          </motion.div>
        ) : view === 'history' ? (
          <motion.div
            key="history-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <ComparisonList profile={profile} />
          </motion.div>
        ) : (
          <motion.div
            key="stats-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">누적 실행 프로토콜</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-slate-900">{stats.total}</span>
                  <span className="text-xs font-bold text-slate-300 mb-1">건</span>
                </div>
              </div>
              <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl shadow-slate-900/20 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/20 blur-3xl" />
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 relative z-10">평균 SOP 준수율</p>
                <div className="flex items-end gap-2 relative z-10">
                  <span className="text-4xl font-black text-white">{stats.avgScore}%</span>
                  <span className={`text-lg font-black ${getGradeColor(getGradeFromScore(stats.avgScore))} mb-1 ml-2`}>
                    {getGradeFromScore(stats.avgScore)}
                  </span>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">최고 달성 점수</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-slate-900">{stats.bestScore}</span>
                  <span className="text-xs font-bold text-slate-300 mb-1">pts</span>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">최근 평가 등급</p>
                <div className="flex items-end gap-2">
                  <span className={`text-4xl font-black ${getGradeColor(stats.recentGrade)}`}>{stats.recentGrade}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary-600" />
                나의 성장 타임라인
              </h3>
              <div className="space-y-6">
                {ownComparisons.slice(0, 5).map((c, i) => (
                  <div key={c.id} className="flex items-center gap-6 group">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-primary-600 ring-4 ring-primary-100' : 'bg-slate-200'}`} />
                      {i !== 4 && <div className="w-0.5 h-12 bg-slate-100" />}
                    </div>
                    <div className="flex-1 bg-slate-50/50 hover:bg-white p-5 rounded-2xl border border-slate-100 transition-all hover:shadow-xl hover:shadow-slate-100 group-hover:-translate-y-0.5 mb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[9px] font-black text-primary-600 uppercase tracking-widest mb-1">{c.category}</p>
                          <h4 className="text-sm font-black text-slate-900">{c.area}</h4>
                        </div>
                        <div className="text-right">
                          <span className={`text-lg font-black ${getGradeColor(getGradeFromScore(c.achievementScore || 0))}`}>
                            {getGradeFromScore(c.achievementScore || 0)}
                          </span>
                          <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">
                            {c.createdAt?.toDate().toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {ownComparisons.length === 0 && (
                  <div className="py-12 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">
                    데이터 수집을 위해 첫 번째 업무를 기록해 보세요.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
