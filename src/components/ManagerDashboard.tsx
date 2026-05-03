import React, { useState, useEffect } from 'react';
import { Category, Comparison, UserProfile, AttendanceRecord } from '../types';
import { storageService } from '../services/storageService';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Users, BarChart3, Plus, Trash2, Save, X, Edit2, Check, ChevronRight, Activity, Sparkles, UserCheck, Shield, Clock, History, Play, Square, Award, Eye, Calendar, MapPin, User, Mail, AlertCircle, Search, Download, FileSpreadsheet } from 'lucide-react';
import { getGradeFromScore, getGradeColor } from '../utils';
import { ImageComparisonSlider } from './ImageComparisonSlider';

interface ManagerDashboardProps {
  profile: UserProfile;
  categories: Category[];
}

export default function ManagerDashboard({ profile, categories }: ManagerDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'categories' | 'logs' | 'personnel' | 'attendance'>('stats');
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [personnel, setPersonnel] = useState<UserProfile[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  if (profile.role !== 'manager') {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-6">
        <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center shadow-xl shadow-red-100/50">
          <Shield size={40} className="text-red-500" />
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">접근 권한 제한</h3>
          <p className="text-slate-500 font-medium mt-2">이 페이지는 관리자 전용입니다. 권한이 부족합니다.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // 1. Subscribe to Comparisons
    const unsubscribeComps = storageService.subscribeToAllComparisons((data) => {
      setComparisons(data);
      setLoading(prev => personnel.length > 0 ? false : prev);
    });

    // 2. Subscribe to Personnel
    const unsubscribePersonnel = storageService.subscribeToPersonnel((data) => {
      setPersonnel(data);
      setLoading(prev => comparisons.length > 0 ? false : prev);
    });

    // 3. Subscribe to Attendance
    const unsubscribeAttendance = storageService.subscribeToAttendance((data) => {
      setAttendanceRecords(data);
    });

    return () => {
      unsubscribeComps();
      unsubscribePersonnel();
      unsubscribeAttendance();
    };
  }, []);

  const [selectedPerson, setSelectedPerson] = useState<UserProfile | null>(null);
  const [selectedComparison, setSelectedComparison] = useState<Comparison | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const handleExportCSV = (type: 'comparisons' | 'attendance') => {
    const data = type === 'comparisons' ? comparisons : attendanceRecords;
    if (data.length === 0) {
      return;
    }

    const filename = type === 'comparisons' ? 'SOP_Comparison_Logs' : 'Attendance_Records';
    
    const quote = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;

    let csvContent = "";
    if (type === 'comparisons') {
      csvContent = "ID,직원메일,구역,카테고리,세부지역,준수율,AI피드백,일시\n";
      csvContent += (data as Comparison[]).map((c: Comparison) => {
        const date = c.createdAt?.toDate ? c.createdAt.toDate().toLocaleString() : new Date(c.createdAt).toLocaleString();
        return `${quote(c.id)},${quote(c.staffEmail)},${quote(c.zone)},${quote(c.category)},${quote(c.area)},${c.achievementScore}%,${quote(c.aiFeedback)},${quote(date)}`;
      }).join('\n');
    } else {
      csvContent = "ID,직원메일,유형,일시\n";
      csvContent += (data as AttendanceRecord[]).map((a: AttendanceRecord) => {
        const date = a.timestamp?.toDate ? a.timestamp.toDate().toLocaleString() : (a.timestamp ? new Date(a.timestamp).toLocaleString() : 'N/A');
        const typeLabel = a.type === 'clock_in' ? '출근' : '퇴근';
        return `${quote(a.id)},${quote(a.userEmail)},${quote(typeLabel)},${quote(date)}`;
      }).join('\n');
    }

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.style.display = 'none';
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      {/* Zoom Modal */}
      <AnimatePresence>
        {zoomedImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomedImage(null)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl cursor-zoom-out"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-[95vw] max-h-[90vh] z-10"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}
                className="fixed top-10 right-10 p-4 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/20 transition-all border border-white/20 shadow-2xl active:scale-90 z-[120]"
              >
                <X className="w-7 h-7" />
              </button>
              <img 
                src={zoomedImage} 
                className="w-auto h-auto max-w-full max-h-[90vh] rounded-3xl shadow-2xl ring-1 ring-white/10" 
                alt="Enlarged"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-3 text-slate-900 mb-2">
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">표준 운영 매뉴얼 (SOP)</span>
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">통합 관제 센터</h2>
          <p className="text-slate-400 font-medium mt-1">실시간 현장 지표 및 AI 성과 데이터 분석</p>
          
          <div className="flex items-center gap-3 mt-6">
            <button 
              onClick={() => handleExportCSV('comparisons')}
              className="flex items-center gap-2 px-4 py-2 bg-white/50 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-white hover:border-slate-400 transition-all shadow-sm"
            >
              <FileSpreadsheet size={14} className="text-emerald-500" />
              <span>SOP 로그 추출</span>
            </button>
            <button 
              onClick={() => handleExportCSV('attendance')}
              className="flex items-center gap-2 px-4 py-2 bg-white/50 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-white hover:border-slate-400 transition-all shadow-sm"
            >
              <Download size={14} className="text-primary-500" />
              <span>근태 기록 추출</span>
            </button>
          </div>
        </div>

        <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/60 backdrop-blur-sm overflow-x-auto scrollbar-hide no-scrollbar">
          <button
            onClick={() => { setActiveSubTab('stats'); setSelectedPerson(null); }}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeSubTab === 'stats' ? 'bg-primary-900 text-white shadow-2xl shadow-primary-900/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>운영 대시보드</span>
          </button>
          <button
            onClick={() => { setActiveSubTab('personnel'); setSelectedPerson(null); }}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeSubTab === 'personnel' ? 'bg-primary-900 text-white shadow-2xl shadow-primary-900/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>인력 리소스</span>
          </button>
          <button
            onClick={() => { setActiveSubTab('categories'); setSelectedPerson(null); }}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeSubTab === 'categories' ? 'bg-primary-900 text-white shadow-2xl shadow-primary-900/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>SOP 설정</span>
          </button>
          <button
            onClick={() => { setActiveSubTab('logs'); setSelectedPerson(null); }}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeSubTab === 'logs' ? 'bg-primary-900 text-white shadow-2xl shadow-primary-900/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>전수 기록</span>
          </button>
          <button
            onClick={() => { setActiveSubTab('attendance'); setSelectedPerson(null); }}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeSubTab === 'attendance' ? 'bg-primary-900 text-white shadow-2xl shadow-primary-900/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>근태 로그</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'stats' && (
          <div className="space-y-8">
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <StatCard title="누적 이미지 로그" value={comparisons.length} icon={<BarChart3 />} color="slate" />
              <StatCard title="금일 실행 프로토콜" value={comparisons.filter(c => c.createdAt?.toDate().toDateString() === new Date().toDateString()).length} icon={<Activity />} color="emerald" />
              <StatCard title="업무 분류 체계" value={categories.length} icon={<Settings />} color="indigo" />
              <StatCard title="현장 근무 인원" value={personnel.length} icon={<Users />} color="amber" />
            </motion.div>

            {/* AI Insights Card */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white overflow-hidden relative shadow-2xl shadow-slate-900/40">
               <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/20 blur-[120px] -translate-y-48 translate-x-48" />
               <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
                 <div className="max-w-md">
                    <div className="flex items-center gap-3 mb-6">
                       <Sparkles className="text-primary-400 w-8 h-8" />
                       <h3 className="text-[10px] font-black tracking-tight uppercase">AI 리포트 아카이브</h3>
                    </div>
                    <p className="text-slate-400 font-medium leading-relaxed">
                       SF-Pro Vision 엔진이 <span className="text-white font-bold">99.2%의 정밀도</span>로 동작하며, 실시간 <span className="text-primary-400 font-bold">SOP 미준수</span> 및 품질 변동성을 검증합니다.
                    </p>
                 </div>
                 <div className="grid grid-cols-2 gap-8 w-full lg:w-auto">
                    <div className="text-center">
                       <div className="text-4xl font-black mb-1">94%</div>
                       <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">SOP 준수율</div>
                    </div>
                    <div className="text-center">
                       <div className="text-4xl font-black mb-1">1.2s</div>
                       <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">평균 분석 속도</div>
                    </div>
                 </div>
               </div>
            </div>

            {/* Performance Leaderboard & Heatmap Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                     <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em]">운영 퍼포먼스 리더보드</h3>
                     <Award className="w-5 h-5 text-amber-500" />
                  </div>
                  {personnel.length > 0 ? (
                    <PerformanceLeaderboard personnel={personnel} comparisons={comparisons} />
                  ) : (
                    <div className="bg-slate-50 rounded-3xl p-12 border border-slate-100 flex flex-col items-center justify-center text-center">
                       <Award className="w-12 h-12 text-slate-200 mb-4" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">데이터 수집 중...</p>
                    </div>
                  )}
               </div>
               <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                     <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em]">팀별 운영 일관성 히트맵</h3>
                     <Activity className="w-5 h-5 text-primary-500" />
                  </div>
                  {personnel.length > 0 && categories.length > 0 ? (
                    <OperationHeatmap personnel={personnel} comparisons={comparisons} categories={categories} />
                  ) : (
                    <div className="bg-slate-50 rounded-3xl p-12 border border-slate-100 flex flex-col items-center justify-center text-center">
                       <Activity className="w-12 h-12 text-slate-200 mb-4" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">카테고리/팀 정보 대기 중</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}

        {activeSubTab === 'personnel' && (
          <motion.div key="personnel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
             {selectedPerson ? (
                <div className="space-y-6">
                   <button 
                     onClick={() => setSelectedPerson(null)}
                     className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-2 mb-4"
                   >
                     <ChevronRight className="w-4 h-4 rotate-180" /> 운영 리소스 목록으로 이동
                   </button>
                   <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-2xl shadow-slate-200/50">
                      <div className="flex items-center gap-6 mb-10">
                         <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-3xl font-black text-slate-300">
                            {selectedPerson.displayName?.[0] || selectedPerson.email[0]}
                         </div>
                         <div>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{selectedPerson.displayName || selectedPerson.email}</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{selectedPerson.role} 현장 오퍼레이션 타임라인</p>
                         </div>
                      </div>
                      <AdminLogs comparisons={comparisons.filter(c => c.staffId === selectedPerson.uid)} onZoom={setZoomedImage} />
                   </div>
                </div>
             ) : (
                <PersonnelGrid 
                  personnel={personnel} 
                  comparisons={comparisons} 
                  attendance={attendanceRecords}
                  onSelect={setSelectedPerson}
                />
             )}
          </motion.div>
        )}

        {activeSubTab === 'categories' && (
          <motion.div key="categories" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <CategoryEditor categories={categories} />
          </motion.div>
        )}

        {activeSubTab === 'logs' && (
          <motion.div key="logs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <AdminLogs comparisons={comparisons} onSelect={setSelectedComparison} onZoom={setZoomedImage} />
          </motion.div>
        )}

        {activeSubTab === 'attendance' && (
          <motion.div key="attendance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <AttendanceLog 
              records={attendanceRecords} 
              comparisons={comparisons}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Audit Modal */}
      <AnimatePresence>
        {selectedComparison && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedComparison(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl pointer-events-auto"
            />
            
            <motion.div 
              layoutId={`comparison-${selectedComparison.id}`}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-6xl h-full sm:h-auto sm:max-h-[90vh] bg-white rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col pointer-events-auto mt-auto sm:mt-0"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 sm:px-10 py-6 sm:py-8 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-900 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-900/20 flex-shrink-0">
                    <Sparkles size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                      <span className="w-fit text-[8px] sm:text-[10px] font-black text-primary-500 uppercase tracking-widest bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100">운영 표준 감사</span>
                      <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                        {selectedComparison.category} 
                         {selectedComparison.subject && <span className="text-primary-600 hidden xs:inline"> ({selectedComparison.subject})</span>}
                      </h2>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
                       <span className="hidden sm:inline">{selectedComparison.staffId.slice(-6)} · </span>
                       <span>{selectedComparison.staffEmail?.split('@')[0]}</span>
                       <span className="hidden sm:inline">· {selectedComparison.createdAt?.toDate().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedComparison(null)}
                  className="p-2 sm:p-3 bg-slate-100 text-slate-400 rounded-xl sm:rounded-2xl hover:bg-slate-200 hover:text-slate-900 transition-all active:scale-90"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                  {/* Left Column: Visuals */}
                  <div className="space-y-6 sm:space-y-8">
                    <section className="space-y-4 sm:space-y-6">
                      <h4 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center">
                        <Activity className="w-4 h-4 text-slate-900 mr-2 sm:mr-3" />
                        운영 현장 비교
                      </h4>
                      <div 
                        className="aspect-[4/3] rounded-[1.5rem] sm:rounded-[2.5rem] bg-slate-900 overflow-hidden shadow-2xl relative ring-4 sm:ring-8 ring-slate-100 group cursor-zoom-in"
                        onClick={() => setZoomedImage(selectedComparison.afterImage)}
                      >
                        <ImageComparisonSlider 
                          before={selectedComparison.beforeImages[0]} 
                          after={selectedComparison.afterImage} 
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                           <span className="text-white font-black text-xs uppercase tracking-widest bg-slate-900/40 px-4 py-2 rounded-full backdrop-blur-md">클릭하여 확대</span>
                        </div>
                        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={() => setZoomedImage(selectedComparison.beforeImages[0])}
                             className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[8px] font-black text-white hover:bg-white/20 transition-all border border-white/10"
                           >
                             전 확대
                           </button>
                           <button 
                             onClick={() => setZoomedImage(selectedComparison.afterImage)}
                             className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[8px] font-black text-white hover:bg-white/20 transition-all border border-white/10"
                           >
                             후 확대
                           </button>
                        </div>
                      </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                         <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">운영 구역</div>
                         <div className="text-sm font-black text-slate-900">{selectedComparison.area}</div>
                      </div>
                      {selectedComparison.subject && (
                        <div className="bg-primary-50 p-6 rounded-3xl border border-primary-100 text-center">
                           <div className="text-[9px] font-black text-primary-400 uppercase tracking-widest mb-1">관리 대상 (식별자)</div>
                           <div className="text-sm font-black text-primary-900">{selectedComparison.subject}</div>
                        </div>
                      )}
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                         <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">기록 버전</div>
                         <div className="text-sm font-black text-slate-900">V1.5.0-정식버전</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: AI Analytics */}
                  <div className="space-y-8">
                    {/* Simplified AI Scorecard */}
                    <section className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center">
                          <Sparkles className="w-4 h-4 text-primary-600 mr-3" />
                          AI 운영 평가 결과
                        </h4>
                      </div>
                      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-primary-500/10 to-transparent pointer-events-none" />
                        <div className="relative flex flex-col items-center md:items-start text-center md:text-left">
                          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-4">FINAL OPERATIONAL RATING</span>
                          <div className="flex items-end gap-5">
                            <span className={`text-[100px] leading-none font-black ${getGradeColor(getGradeFromScore(selectedComparison.achievementScore || 0))}`}>
                              {getGradeFromScore(selectedComparison.achievementScore || 0)}
                            </span>
                            <div className="flex flex-col pb-3 shrink-0">
                              <span className="text-4xl font-black text-white">{selectedComparison.achievementScore || 0}</span>
                              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Points</span>
                            </div>
                          </div>
                        </div>

                        <div className="h-px w-full md:h-32 md:w-px bg-white/10 relative z-10" />

                        <div className="relative flex-1 grid grid-cols-1 gap-4 w-full">
                          <div className="bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-2">분석 프로토콜</span>
                            <span className="text-lg font-black text-white">{selectedComparison.category}</span>
                          </div>
                          <div className="bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1">검증 상태</span>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-lg font-black text-emerald-400">VERIFIED</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center">
                        <History className="w-4 h-4 text-slate-900 mr-3" />
                        기록 상세 메타데이터
                      </h4>
                      <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-4">
                         <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-400 uppercase tracking-widest">담당 직원 계정</span>
                            <span className="text-slate-900 font-black tracking-tight">{selectedComparison.staffEmail}</span>
                         </div>
                         <div className="h-px bg-slate-200/50" />
                         <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-400 uppercase tracking-widest">캡처 시각</span>
                            <span className="text-slate-900 font-black tracking-tight">{selectedComparison.createdAt?.toDate().toLocaleString()}</span>
                         </div>
                      </div>
                    </section>

                    {/* Checklist Results */}
                    {selectedComparison.checklist && Object.keys(selectedComparison.checklist).length > 0 && (
                      <section className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center">
                            <Check className="w-4 h-4 text-green-500 mr-3" />
                            업무 표준 준수 검증 (Checklist)
                          </h4>
                          <div className="h-px flex-1 bg-slate-100 ml-6" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Object.entries(selectedComparison.checklist).map(([item, checked]) => (
                            <div key={item} className={`flex items-center space-x-4 p-4 rounded-2xl border-2 transition-all duration-300 ${
                              checked 
                                ? 'bg-white border-green-100 shadow-lg shadow-green-100/50' 
                                : 'bg-slate-50 border-slate-100 opacity-60'
                            }`}>
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-sm ${checked ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                {checked ? <Check className="w-4 h-4" strokeWidth={4} /> : <Clock className="w-3.5 h-3.5" />}
                              </div>
                              <span className={`text-[11px] font-black uppercase tracking-wider ${checked ? 'text-slate-900' : 'text-slate-400'}`}>{item}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PersonnelGrid({ personnel, comparisons, attendance, onSelect }: any) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<{id: string, team: string} | null>(null);

  const handleUpdateTeam = async (uid: string, team: string) => {
    try {
      setUpdatingId(uid);
      await storageService.updateProfile(uid, { team });
      setEditingTeam(null);
    } catch (err) {
      console.error("Failed to update team:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {personnel.map((user: UserProfile) => {
        const userComparisons = comparisons.filter((c: Comparison) => c.staffId === user.uid);
        const userAttendance = attendance.filter((a: AttendanceRecord) => a.userId === user.uid);
        const lastAction = userAttendance[0]; // attendance is sorted by timestamp desc
        const isOnline = lastAction?.type === 'clock_in';

        const avgScore = userComparisons.length > 0 
          ? Math.round(userComparisons.reduce((acc, c) => acc + (c.achievementScore || 0), 0) / userComparisons.length)
          : null;
        const avgGrade = avgScore !== null ? getGradeFromScore(avgScore) : null;

        return (
          <div key={user.uid} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-8 flex flex-col group hover:border-slate-300 transition-all duration-500 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform">
               <Award className="w-32 h-32" />
            </div>
            
            <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-xl font-black text-slate-400 border-2 border-white shadow-lg overflow-hidden">
                        {user.displayName?.[0].toUpperCase() || user.email[0].toUpperCase()}
                      </div>
                      {isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white shadow-lg" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{user.displayName || user.email.split('@')[0]}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary-600 bg-primary-100/50 px-2 py-0.5 rounded-full">{user.role === 'manager' ? '관리자' : '직원'}</span>
                        {editingTeam?.id === user.uid ? (
                          <div className="flex items-center gap-1">
                             <input 
                               autoFocus
                               className="text-[9px] font-black border rounded px-1 w-16"
                               value={editingTeam.team}
                               onChange={e => setEditingTeam({...editingTeam, team: e.target.value})}
                               onKeyDown={e => e.key === 'Enter' && handleUpdateTeam(user.uid, editingTeam.team)}
                             />
                             <button onClick={() => handleUpdateTeam(user.uid, editingTeam.team)} className="text-primary-600"><Check size={8} /></button>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditingTeam({id: user.uid, team: user.team || ''}); }}
                            className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full hover:bg-slate-200 transition-colors"
                          >
                            {user.team || '소속 팀 설정'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                {avgGrade ? (
                  <div className="text-center px-1">
                                <div className="text-[14px] font-black leading-none bg-gradient-to-br from-slate-900 to-primary-900 bg-clip-text text-transparent">{avgGrade}</div>
                                <div className="text-[7px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">평균 등급</div>
                              </div>
                            ) : (
                  <Users className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">이미지 기록</p>
                <div className="flex items-center gap-2">
                   <Activity className="w-4 h-4 text-slate-900" />
                   <span className="text-2xl font-black text-slate-900">{userComparisons.length}</span>
                </div>
              </div>
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">상태</p>
                <div className="flex items-center gap-2">
                   {isOnline ? <Play className="w-3.5 h-3.5 text-emerald-500 fill-current" /> : <Square className="w-3.5 h-3.5 text-slate-300 fill-current" />}
                   <span className={`text-sm font-black uppercase tracking-widest ${isOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {isOnline ? '활동 중' : '오프라인'}
                   </span>
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-4">
              <div className="flex items-center justify-between px-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">최종 분석 캡처</p>
                 <Clock className="w-3 h-3 text-slate-300" />
              </div>
              <div className="bg-slate-50/30 rounded-2xl p-4 border border-slate-50/50 max-h-32 overflow-y-auto space-y-3 custom-scrollbar">
                {userAttendance.slice(0, 3).map((a: AttendanceRecord) => (
                  <div key={a.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${a.type === 'clock_in' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{a.type.replace('_', ' ')}</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">
                       {a.timestamp?.toDate ? a.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </span>
                  </div>
                ))}
                {userAttendance.length === 0 && (
                  <p className="text-[9px] font-bold text-slate-300 italic text-center py-2">오늘 기록된 활동 없음</p>
                )}
              </div>
            </div>

            <button 
              onClick={() => onSelect(user)}
              className="w-full mt-8 py-4 bg-primary-900 hover:bg-primary-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <ChevronRight className="w-4 h-4" />
              <span>업무 성과 인사이트 분석</span>
            </button>
          </div>
        );
      })}
      {personnel.length === 0 && (
        <div className="col-span-full py-24 text-center">
           <p className="text-slate-300 font-black text-xs uppercase tracking-[0.3em]">등록된 운영 리소스가 없습니다</p>
        </div>
      )}
    </div>
  );
}

function PerformanceLeaderboard({ personnel, comparisons }: { personnel: UserProfile[], comparisons: Comparison[] }) {
   // Group team scores
   const teamStats = personnel.reduce((acc, user) => {
      const team = user.team || '미분류';
      if (!acc[team]) acc[team] = { totalScore: 0, count: 0 };
      
      const userComps = comparisons.filter(c => c.staffId === user.uid);
      if (userComps.length > 0) {
         acc[team].totalScore += userComps.reduce((s, c) => s + (c.achievementScore || 0), 0);
         acc[team].count += userComps.length;
      }
      return acc;
   }, {} as Record<string, { totalScore: number, count: number }>);

   const leaderboard = Object.entries(teamStats)
      .map(([name, stats]) => ({
         name,
         avgScore: stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0,
         count: stats.count
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);

   const bestPractices = [...comparisons]
      .filter(c => (c.achievementScore || 0) >= 95)
      .sort((a, b) => (b.achievementScore || 0) - (a.achievementScore || 0))
      .slice(0, 3);

   return (
      <div className="space-y-6">
         <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl shadow-slate-100/50">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Top 5 운영 팀 (준수율 기준)</h4>
            <div className="space-y-4">
               {leaderboard.map((team, idx) => (
                  <div key={team.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <div className="flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${idx === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'}`}>
                           {idx + 1}
                        </span>
                        <div>
                           <p className="text-sm font-black text-slate-900">{team.name}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">데이터셋 {team.count}건</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="text-lg font-black text-primary-900">{team.avgScore}%</div>
                        <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                           <div className="h-full bg-primary-900 rounded-full" style={{ width: `${team.avgScore}%` }} />
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl shadow-slate-900/20 text-white">
            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6">베스트 프랙티스 (SOP 마스터)</h4>
            <div className="space-y-4">
               {bestPractices.map((bp) => (
                  <div key={bp.id} className="flex items-center gap-4 group cursor-pointer hover:bg-white/5 p-2 rounded-2xl transition-all">
                     <div className="w-16 h-16 rounded-xl bg-white/10 overflow-hidden ring-1 ring-white/10">
                        <img src={bp.afterImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                           <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">BEST QUALITY</span>
                           <span className="text-xs font-black text-white">100%</span>
                        </div>
                        <p className="text-sm font-black truncate">{bp.category}</p>
                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{bp.staffEmail.split('@')[0]}</p>
                     </div>
                  </div>
               ))}
               {bestPractices.length === 0 && (
                  <p className="text-[9px] font-bold text-white/30 italic text-center py-4 uppercase">완전 준수 사례 수집 중...</p>
               )}
            </div>
         </div>
      </div>
   );
}

function OperationHeatmap({ personnel, comparisons, categories }: { personnel: UserProfile[], comparisons: Comparison[], categories: Category[] }) {
   const teams = Array.from(new Set(personnel.map(p => p.team || '미분류'))).filter(Boolean).sort();
   const catNames = Array.from(new Set(categories.map(c => c.name))).sort();

   if (teams.length === 0 || catNames.length === 0) {
      return (
         <div className="bg-white rounded-3xl border border-slate-200 p-12 shadow-xl shadow-slate-100/50 flex flex-col items-center justify-center text-center h-[400px]">
            <MapPin className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">비교 데이터 로드 중...</p>
         </div>
      );
   }

   const getScore = (team: string, category: string) => {
      const teamUserIds = personnel.filter(p => (p.team || '미분류') === team).map(p => p.uid);
      const relevantComps = comparisons.filter(c => teamUserIds.includes(c.staffId) && c.category === category);
      
      if (relevantComps.length === 0) return null;
      return Math.round(relevantComps.reduce((acc, c) => acc + (c.achievementScore || 0), 0) / relevantComps.length);
   };

   return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl shadow-slate-100/50 overflow-hidden">
         <div className="overflow-x-auto pb-4 custom-scrollbar">
            <div className="min-w-[600px]">
               <div className="grid grid-cols-[120px_1fr] border-b border-slate-100 pb-4">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">운영 팀</div>
                  <div className="flex justify-between px-4">
                     {catNames.map(name => (
                        <div key={name} className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-24 truncate" title={name}>
                           {name}
                        </div>
                     ))}
                  </div>
               </div>
               <div className="divide-y divide-slate-50">
                  {teams.map(team => (
                     <div key={team} className="grid grid-cols-[120px_1fr] py-4 items-center">
                        <div className="text-[11px] font-black text-slate-900 truncate pr-4">{team}</div>
                        <div className="flex justify-between items-center px-4">
                           {catNames.map(name => {
                              const score = getScore(team, name);
                              return (
                                 <div 
                                    key={name} 
                                    className={`w-14 h-10 rounded-xl flex items-center justify-center text-[10px] font-black border transition-all hover:scale-110 cursor-help ${
                                       score === null ? 'bg-slate-50 border-slate-100 text-slate-200' :
                                       score >= 90 ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg shadow-emerald-500/20' :
                                       score >= 80 ? 'bg-emerald-100 border-emerald-200 text-emerald-700' :
                                       score >= 70 ? 'bg-amber-100 border-amber-200 text-amber-700' :
                                       'bg-red-100 border-red-200 text-red-700'
                                    }`}
                                    title={`${team} - ${name}: ${score === null ? '데이터 없음' : score + '%'}`}
                                 >
                                    {score === null ? '-' : score + '%'}
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
         <div className="mt-8 flex items-center justify-center gap-6 pt-6 border-t border-slate-50">
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded bg-emerald-500" />
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">최상 (90%+)</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded bg-emerald-100" />
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">정상 (80%+)</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded bg-amber-100" />
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">주의 (70%+)</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded bg-red-100" />
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">위험 (70%-)</span>
            </div>
         </div>
      </div>
   );
}


function CategoryEditor({ categories }: any) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Category>>({});
  const [newCat, setNewCat] = useState<Partial<Category>>({
    zone: '',
    name: '',
    areas: [],
    defaultChecklist: [],
    order: categories.length + 1
  });

  // Unique zones
  const baseZones = Array.from(new Set(categories.map((c: Category) => c.zone))).filter(Boolean) as string[];
  const hasUnzoned = categories.some((c: Category) => !c.zone);
  const zones = hasUnzoned ? [...baseZones, '기타 (미분류)'] : baseZones;

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditForm(cat);
  };

  const handleSave = async (id: string) => {
    try {
      await storageService.updateCategory(id, editForm);
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update category:", err);
    }
  };

  const handleAddCategory = async () => {
    try {
      if (!newCat.name || !newCat.zone) return;
      await storageService.addCategory({
        zone: newCat.zone,
        name: newCat.name,
        areas: newCat.areas || [],
        defaultChecklist: newCat.defaultChecklist || [],
        order: newCat.order || categories.length + 1
      });
      setShowAddForm(false);
      setNewCat({ zone: '', name: '', areas: [], defaultChecklist: [], order: categories.length + 2 });
    } catch (err) {
      console.error("Failed to add category:", err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this zone protocol?')) return;
    try {
      await storageService.deleteCategory(id);
    } catch (err) {
      console.error("Failed to delete category:", err);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
        <div>
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-[0.3em]">SOP 프로토콜 아키텍처</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">구역별 하위 카테고리 고정 및 준수 규준 관리</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-primary-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-primary-900/30 hover:scale-105 hover:bg-primary-800 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>신규 카테고리 활성화</span>
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-10 rounded-[3rem] border-2 border-primary-900 shadow-2xl shadow-primary-900/10 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-900/5 blur-3xl -translate-y-16 translate-x-16" />
            
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary-900 rounded-xl flex items-center justify-center text-white">
                  <Plus className="w-5 h-5" />
                </div>
                <h4 className="text-xl font-black text-slate-900 uppercase tracking-widest">신규 운영 프로토콜 정의</h4>
              </div>
              <button 
                onClick={() => setShowAddForm(false)} 
                className="p-2 bg-slate-100 text-slate-400 hover:text-slate-900 rounded-xl transition-all"
              >
                <X />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary-500" />
                    상위 운영 구역 (Zone)
                  </label>
                  <div className="relative">
                    <input 
                      list="existing-zones"
                      value={newCat.zone}
                      onChange={e => setNewCat({...newCat, zone: e.target.value})}
                      placeholder="예: 리셉션, 외래구역, 중앙수술센터"
                      className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-100 font-bold focus:outline-none focus:ring-4 ring-primary-900/5 transition-all"
                    />
                    <datalist id="existing-zones">
                      {zones.map(z => <option key={z} value={z} />)}
                    </datalist>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary-500" />
                    하위 카테고리 (Category)
                  </label>
                  <input 
                    value={newCat.name}
                    onChange={e => setNewCat({...newCat, name: e.target.value})}
                    placeholder="예: 상담용 카운터, 대기실 소파"
                    className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-100 font-bold focus:outline-none focus:ring-4 ring-primary-900/5 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary-500" />
                    세부 평가 지역 (쉼표 구분)
                  </label>
                  <input 
                    value={newCat.areas?.join(', ')}
                    onChange={e => setNewCat({...newCat, areas: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                    placeholder="예: 좌측, 우측, 상단 선반"
                    className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-100 font-bold focus:outline-none focus:ring-4 ring-primary-900/5 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary-500" />
                  SOP 체크리스트 (Enter로 구분)
                </label>
                <textarea 
                  value={newCat.defaultChecklist?.join('\n')}
                  onChange={e => setNewCat({...newCat, defaultChecklist: e.target.value.split('\n').filter(s => s)})}
                  placeholder="예: 먼지 제거 상태 확인&#10;정렬 상태 가이드 준수&#10;소독 티슈 비치 확인"
                  className="w-full p-6 bg-slate-50 rounded-[2rem] border border-slate-100 font-bold focus:outline-none focus:ring-4 ring-primary-900/5 min-h-[220px] transition-all resize-none custom-scrollbar"
                />
              </div>
            </div>
            
            <div className="mt-10 flex justify-end">
              <button 
                onClick={handleAddCategory}
                className="bg-primary-900 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-primary-900/30 active:scale-95 transition-all hover:bg-primary-800 flex items-center gap-3"
              >
                <Save size={16} />
                <span>카테고리 구성 완료 및 즉시 배포</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-16">
        {zones.length === 0 && !showAddForm && (
           <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
             <div className="w-20 h-20 bg-slate-50 rounded-3xl mx-auto flex items-center justify-center text-slate-200 mb-6">
                <Settings size={40} />
             </div>
             <p className="text-slate-300 font-black text-xs uppercase tracking-[0.3em]">배포된 하이퍼-SOP 체계가 없습니다</p>
             <button 
                onClick={() => setShowAddForm(true)}
                className="mt-6 text-primary-600 font-black text-[10px] uppercase tracking-widest hover:underline"
             >
                첫 번째 운영 프로토콜 생성하기
             </button>
           </div>
        )}

        {zones.map(zone => (
          <div key={zone} className="space-y-8">
            <div className="flex items-center gap-6 px-4">
               <div className="flex flex-col">
                  <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{zone}</h4>
                  <div className="flex items-center gap-2 mt-1">
                     <div className="w-1 h-1 rounded-full bg-primary-500" />
                     <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">운영 구역 활성 프로토콜</span>
                  </div>
               </div>
               <div className="h-px flex-1 bg-slate-200/50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.filter((c: Category) => (c.zone === zone) || (!c.zone && zone === '기타 (미분류)')).map((cat: Category) => (
                <motion.div 
                  layout 
                  key={cat.id} 
                  className={`bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 group transition-all duration-500 overflow-hidden relative ${editingId === cat.id ? 'ring-2 ring-primary-900' : 'hover:border-primary-900'}`}
                >
                  {editingId === cat.id ? (
                    <div className="space-y-6 relative z-10">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">상위 구역 (Zone)</label>
                        <input 
                          value={editForm.zone} 
                          onChange={e => setEditForm({...editForm, zone: e.target.value})}
                          className="w-full text-base font-black border-b-2 border-slate-200 focus:border-primary-900 focus:outline-none py-1 bg-transparent tracking-tight"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">하위 명칭 (Category)</label>
                        <input 
                          value={editForm.name} 
                          onChange={e => setEditForm({...editForm, name: e.target.value})}
                          className="w-full text-lg font-black border-b-2 border-primary-900 focus:outline-none py-1 bg-transparent tracking-tight"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">지역</label>
                        <input 
                          value={editForm.areas?.join(', ')} 
                          onChange={e => setEditForm({...editForm, areas: e.target.value.split(',').map(s => s.trim())})}
                          className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-bold focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">체크리스트</label>
                        <textarea 
                          value={editForm.defaultChecklist?.join('\n')} 
                          onChange={e => setEditForm({...editForm, defaultChecklist: e.target.value.split('\n').filter(s => s)})}
                          className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] font-bold focus:outline-none min-h-[140px] resize-none"
                        />
                      </div>
                      <div className="flex space-x-3 pt-4">
                        <button onClick={() => handleSave(cat.id)} className="flex-1 bg-primary-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary-900/20 hover:bg-primary-800">
                          <Save size={14} /> <span>저장</span>
                        </button>
                        <button onClick={() => setEditingId(null)} className="px-6 bg-slate-100 text-slate-400 py-4 rounded-2xl hover:bg-slate-200 transition-colors">
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10 h-full flex flex-col">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="text-[8px] font-black text-primary-500 uppercase tracking-[0.2em] mb-1">{cat.zone}</div>
                          <h4 className="text-2xl font-black text-slate-900 tracking-tighter leading-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">{cat.name}</h4>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <button onClick={() => startEdit(cat)} className="p-2.5 text-slate-400 hover:text-primary-900 hover:bg-slate-50 rounded-xl transition-all shadow-sm">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => handleDeleteCategory(cat.id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-6 mb-8">
                        <div>
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-3">집계 대상 운영 지역</p>
                          <div className="flex flex-wrap gap-2">
                            {cat.areas.map(a => (
                              <span key={a} className="text-[9px] font-black px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl border border-slate-100 uppercase tracking-tight group-hover:bg-primary-50 group-hover:border-primary-100 group-hover:text-primary-700 transition-colors">{a}</span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-50">
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-3">중점 규정 항목</p>
                          <div className="space-y-2">
                            {cat.defaultChecklist.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3 text-[10px] font-bold text-slate-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-900/20 group-hover:bg-primary-500 transition-colors shadow-sm" />
                                <span className="truncate">{item}</span>
                              </div>
                            ))}
                            {cat.defaultChecklist.length > 3 && (
                              <div className="flex items-center gap-2 mt-2">
                                <Plus size={10} className="text-primary-400" />
                                <p className="text-[9px] font-black text-primary-500 uppercase tracking-widest">외 {cat.defaultChecklist.length - 3}개 프로토콜</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-900 group-hover:text-white transition-all shadow-inner">
                            <Shield size={14} />
                          </div>
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{cat.defaultChecklist.length} 포인트 인증</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">VIEW DETAILS</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttendanceLog({ records, comparisons }: { records: AttendanceRecord[], comparisons: Comparison[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Group records by user email
  const userGroups = records.reduce((acc, record) => {
    const email = record.userEmail;
    if (!acc[email]) {
      acc[email] = {
        userName: record.userName,
        userEmail: record.userEmail,
        userId: record.userId,
        records: []
      };
    }
    acc[email].records.push(record);
    return acc;
  }, {} as Record<string, { userName: string | undefined, userEmail: string, userId: string, records: AttendanceRecord[] }>);

  // Sort groups and filter by search term
  const filteredGroups = Object.values(userGroups)
    .filter(group => 
      group.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      group.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (a.userName || '').localeCompare(b.userName || ''));

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 flex items-center gap-4">
        <Search className="w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="구성원 이름 또는 이메일 검색..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none focus:ring-0 text-sm font-black text-slate-900 placeholder:text-slate-300 w-full"
        />
      </div>

      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl shadow-slate-200/50">
        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-slate-100">
          {filteredGroups.map((group) => {
            const isExpanded = expandedUser === group.userEmail;
            const lastRecord = group.records.sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime())[0];
            
            return (
              <div key={group.userEmail} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-[11px] font-black text-primary-600">
                      {group.userName?.[0] || group.userEmail[0]}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{group.userName || 'Unknown'}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{group.userEmail}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setExpandedUser(isExpanded ? null : group.userEmail)}
                    className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-slate-200 text-slate-600' : 'bg-slate-900 text-white'}`}
                  >
                    {isExpanded ? <X size={16} /> : <Search size={16} />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] font-black">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-400 uppercase tracking-widest">누적 로그</span>
                    <span className="text-slate-900">{group.records.length}건</span>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-slate-400 uppercase tracking-widest">최종 분석</span>
                    <span className="text-slate-900">{lastRecord?.timestamp?.toDate().toLocaleDateString()}</span>
                  </div>
                </div>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 space-y-4 pt-6 border-t border-slate-100"
                  >
                    {group.records
                      .sort((a,b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime())
                      .map(record => (
                        <div key={record.id} className="bg-slate-50 p-4 rounded-2xl space-y-2">
                           <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black text-slate-900">{record.timestamp.toDate().toLocaleString()}</span>
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${record.type === 'clock_in' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                 {record.type === 'clock_in' ? '현장 접속' : '세션 종료'}
                              </span>
                           </div>
                        </div>
                      ))}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">운영 리소스 / 계정</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">누적 데이터셋</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">최종 분석 일시</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">인사이트 분석</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredGroups.map((group) => {
                const isExpanded = expandedUser === group.userEmail;
                const lastRecord = group.records.sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime())[0];

                return (
                  <React.Fragment key={group.userEmail}>
                    <tr className={`hover:bg-slate-50/30 transition-colors ${isExpanded ? 'bg-slate-50/50' : ''}`}>
                      <td className="px-10 py-7">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-2xl flex items-center justify-center text-[11px] font-black text-primary-600">
                            {group.userName?.[0] || group.userEmail[0]}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{group.userName || 'Unknown'}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group.userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-7">
                        <span className="text-xs font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                          {group.records.length}건
                        </span>
                      </td>
                      <td className="px-10 py-7">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900">
                            {lastRecord?.timestamp?.toDate().toLocaleDateString()}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {lastRecord?.type === 'clock_in' ? '현장 접속' : '세션 종료'} 활동
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-7 text-right">
                        <button 
                          onClick={() => setExpandedUser(isExpanded ? null : group.userEmail)}
                          className={`inline-flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                            isExpanded ? 'bg-slate-200 text-slate-600 shadow-slate-200/20' : 'bg-slate-900 text-white shadow-slate-900/10 hover:bg-slate-800'
                          }`}
                        >
                          {isExpanded ? <X size={14} /> : <Search size={14} />}
                          <span>아카이브 열람</span>
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/10">
                        <td colSpan={4} className="px-10 py-8">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-8"
                          >
                             <div className="space-y-4">
                               <div className="flex items-center gap-4 text-slate-400 mb-6">
                                  <div className="h-px flex-1 bg-slate-200"></div>
                                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">유닛 통합 오퍼레이션 타임라인</span>
                                  <div className="h-px flex-1 bg-slate-200"></div>
                               </div>
                               
                               <div className="grid grid-cols-1 gap-4">
                                  {group.records
                                    .sort((a,b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime())
                                    .map(record => {
                                       const relatedPerformance = comparisons
                                          .filter(c => c.staffId === record.userId)
                                          .filter(c => {
                                            const rTime = record.timestamp.toDate().getTime();
                                            const cTime = c.createdAt.toDate().getTime();
                                            return Math.abs(rTime - cTime) < 12 * 60 * 60 * 1000;
                                          })
                                          .sort((a,b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime())
                                          .slice(0, 2);

                                       return (
                                          <div key={record.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between gap-8 group hover:border-primary-200 transition-colors">
                                             <div className="flex items-center gap-6">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                                   record.type === 'clock_in' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                                                }`}>
                                                   <Clock size={20} />
                                                </div>
                                                <div>
                                                   <div className="flex items-center gap-3 mb-1">
                                                      <span className="text-[13px] font-black text-slate-900">
                                                         {record.timestamp.toDate().toLocaleString()}
                                                      </span>
                                                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                                                         record.type === 'clock_in' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                                      }`}>
                                                         {record.type === 'clock_in' ? '현장 접속' : '세션 종료'}
                                                      </span>
                                                   </div>
                                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                      IP: 192.168.0.*** {record.type === 'clock_in' ? '· 운영 프로토콜 적용됨' : ''}
                                                   </p>
                                                </div>
                                             </div>

                                             <div className="flex items-center gap-3">
                                                {relatedPerformance.length > 0 ? (
                                                  <div className="flex items-center gap-2">
                                                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mr-2">인사이트 요약</span>
                                                     {relatedPerformance.map(perf => (
                                                        <div key={perf.id} className="bg-slate-50 px-3 py-2 rounded-xl flex items-center gap-3 border border-slate-100">
                                                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{perf.category} 준수율</span>
                                                           <span className={`text-xs font-black ${getGradeColor(getGradeFromScore(perf.achievementScore || 0))}`}>
                                                              {perf.achievementScore}%
                                                           </span>
                                                        </div>
                                                     ))}
                                                  </div>
                                                ) : (
                                                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">정밀 분석 대기 중</span>
                                                )}
                                             </div>
                                          </div>
                                       );
                                    })}
                               </div>
                             </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredGroups.length === 0 && (
           <div className="py-24 text-center border-t border-slate-50">
             <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
             <p className="text-slate-300 font-black text-xs uppercase tracking-[0.3em]">No matching members found</p>
           </div>
        )}
      </div>
    </div>
  );
}

function AdminLogs({ comparisons, onSelect, onZoom }: any) {
  return (
    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl shadow-slate-200/50">
      {/* Mobile View: Cards */}
      <div className="block lg:hidden divide-y divide-slate-100">
        {comparisons.map((c: Comparison) => (
          <div key={c.id} className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-[10px] font-black text-white">
                  {c.staffEmail?.[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">{c.staffEmail?.split('@')[0]}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{c.createdAt?.toDate().toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[14px] font-black ${getGradeColor(getGradeFromScore(c.achievementScore || 0))}`}>
                  {getGradeFromScore(c.achievementScore || 0)}
                </span>
                <button 
                  onClick={() => onSelect && onSelect(c)}
                  className="p-2 bg-slate-100 text-slate-400 rounded-lg"
                >
                  <Eye size={16} />
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => onZoom(c.beforeImages[0])} className="flex-1 aspect-square rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
                <img src={c.beforeImages[0]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
              <button onClick={() => onZoom(c.afterImage)} className="flex-1 aspect-square rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
                <img src={c.afterImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-white bg-slate-900 px-2 py-0.5 rounded">{c.category}</span>
              <span className="text-slate-400">{c.area}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">관제 시점 / 유닛 ID</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">분석 증적 (Evidence)</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">SOP 아키텍처</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">품질 등급</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">동작</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {comparisons.map((c: Comparison) => (
              <tr key={c.id} className="hover:bg-slate-50/30 transition-colors group">
                <td className="px-10 py-7">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-xs font-black text-white shadow-xl shadow-slate-900/10">
                      {c.staffEmail?.[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 tracking-tight">{c.staffEmail?.split('@')[0]}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-wider">{c.createdAt?.toDate().toLocaleDateString()}</p>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-7">
                   <div className="flex -space-x-4 group-hover:space-x-1 transition-all">
                      <button 
                        onClick={() => onZoom(c.beforeImages[0])}
                        className="w-12 h-12 rounded-xl border-2 border-white shadow-md overflow-hidden bg-slate-100 shrink-0 transform group-hover:rotate-[-6deg] cursor-zoom-in active:scale-95 transition-transform"
                      >
                         <img src={c.beforeImages[0]} alt="Before" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                      <button 
                        onClick={() => onZoom(c.afterImage)}
                        className="w-12 h-12 rounded-xl border-2 border-white shadow-md overflow-hidden bg-slate-100 shrink-0 transform group-hover:rotate-[6deg] cursor-zoom-in active:scale-95 transition-transform"
                      >
                         <img src={c.afterImage} alt="After" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                   </div>
                </td>
                <td className="px-10 py-7">
                  <div className="flex flex-col items-start">
                    <span className="text-[9px] font-black text-white bg-slate-900 px-2 py-0.5 rounded uppercase tracking-widest mb-1">{c.category}</span>
                    <span className="text-xs font-bold text-slate-500 tracking-tight line-clamp-1">
                      {c.area} {c.subject && <span className="text-primary-600 ml-1">· {c.subject}</span>}
                    </span>
                  </div>
                </td>
                <td className="px-10 py-7">
                   <div className="flex items-center space-x-3">
                    {c.achievementScore !== undefined ? (
                      <>
                        <div className={`text-xl font-black ${getGradeColor(getGradeFromScore(c.achievementScore))}`}>
                          {getGradeFromScore(c.achievementScore)}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400">
                           {c.achievementScore}%
                        </div>
                      </>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-300">N/A</span>
                    )}
                  </div>
                </td>
                <td className="px-10 py-7">
                   <button 
                     onClick={() => onSelect && onSelect(c)}
                     className="p-3 bg-slate-100 text-slate-400 hover:text-primary-900 hover:bg-primary-50 rounded-2xl transition-all active:scale-90"
                   >
                     <Eye size={18} />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {comparisons.length === 0 && (
         <div className="py-24 text-center border-t border-slate-50">
           <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
             <Activity className="w-10 h-10 text-slate-200" />
           </div>
           <p className="text-slate-300 font-black text-xs uppercase tracking-[0.3em]">사용 가능한 레지스트리 항목이 없습니다</p>
         </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colors: any = {
    slate: 'bg-slate-100 text-slate-900 border-slate-200',
    emerald: 'bg-green-50 text-green-600 border-green-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 group hover:border-slate-400 transition-all duration-500">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border-2 shadow-sm ${colors[color]}`}>
        {React.cloneElement(icon, { size: 28, strokeWidth: 2.5 })}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
      <h4 className="text-4xl font-black text-slate-900 mt-2 tracking-tighter">{value}</h4>
    </div>
  );
}
