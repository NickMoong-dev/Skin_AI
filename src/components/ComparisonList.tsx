import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { Comparison, UserProfile } from '../types';
import { storageService } from '../services/storageService';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Calendar, MapPin, Eye, ChevronRight, Clock, User, Filter, Sparkles, Check, Plus, AlertCircle, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ImageComparisonSlider } from './ImageComparisonSlider';
import { getGradeFromScore, getGradeColor } from '../utils';

interface ComparisonListProps {
  profile: UserProfile;
}

export const ComparisonList: React.FC<ComparisonListProps> = ({ profile }) => {
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Comparison | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    
    // Use the modular subscription service
    const unsubscribe = storageService.subscribeToStaffComparisons(
      profile.uid,
      (data) => {
        setComparisons(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">SF-PRO: 인텔리전스 데이터 로딩 중...</p>
      </div>
    );
  }

  if (comparisons.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] p-16 text-center border-2 border-dashed border-slate-100 shadow-xl shadow-slate-100/50">
        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Clock className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">아카이브된 기록이 없습니다</h3>
        <p className="text-slate-400 text-sm font-medium">새로운 업무 품질 성과를 기록하여 정밀 분석 아카이브를 구축하세요.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
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

      {/* List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 mb-6">
          <div className="flex items-center justify-between px-2 mb-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">인텔리전스 아카이브</h3>
            <span className="text-[10px] font-bold text-slate-900 bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-sm">
              {comparisons.length}
            </span>
          </div>
          <div className="space-y-3">
            {comparisons.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className={`w-full text-left p-5 rounded-[2rem] border transition-all duration-300 group ${
                  selected?.id === item.id 
                    ? 'bg-white border-slate-900 shadow-2xl shadow-slate-200 ring-4 ring-slate-900/5' 
                    : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-100 transform hover:-translate-y-0.5'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider transition-colors ${
                    selected?.id === item.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                  }`}>
                    {item.category}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {item.createdAt?.toDate().toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm truncate mb-1">{item.area}</h4>
                {item.subject && (
                  <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mb-3 truncate">
                    대상: {item.subject}
                  </p>
                )}
                <div className="flex items-center text-[10px] font-black text-slate-400 space-x-3">
                  <div className="flex items-center group-hover:text-slate-600 transition-colors">
                    <div className="w-5 h-5 border-2 border-white bg-slate-100 rounded-full flex items-center justify-center mr-2 overflow-hidden shadow-sm">
                      <img src={item.afterImage} className="w-full h-full object-cover" />
                    </div>
                    <span className="uppercase tracking-widest">검증됨</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail */}
      <div className="lg:col-span-3">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden sticky top-24"
            >
              <div className="p-6 sm:p-10 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <span className="w-fit text-[10px] font-black text-white bg-slate-900 px-3 py-1 rounded-full uppercase tracking-widest">ID: {selected.id?.slice(-8).toUpperCase()}</span>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {selected.area} {selected.subject && <span className="text-primary-600">({selected.subject})</span>} 분석
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 font-medium tracking-wide">
                    업무 분류: <span className="font-black text-slate-900 decoration-slate-200 underline underline-offset-4">{selected.category}</span> · {selected.createdAt?.toDate().toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-xl shadow-slate-100">
                    <Eye className="w-6 h-6 text-slate-900" />
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-10 space-y-8 sm:space-y-12">
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">AI 비전 분석 엔진</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-900 uppercase">정밀 대조 분석</span>
                    </div>
                  </div>
                  <div 
                    className="relative group cursor-zoom-in"
                    onClick={() => setSelected && setZoomedImage(selected.afterImage)}
                  >
                    <ImageComparisonSlider 
                      before={selected.beforeImages[0]} 
                      after={selected.afterImage} 
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                       <span className="text-white font-black text-xs uppercase tracking-widest bg-slate-900/40 px-4 py-2 rounded-full backdrop-blur-md">클릭하여 확대</span>
                    </div>
                    <div className="absolute bottom-4 right-4 flex gap-2">
                       <button 
                         onClick={() => setZoomedImage(selected.beforeImages[0])}
                         className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[8px] font-black text-white hover:bg-white/20 transition-all border border-white/10"
                       >
                         전 확대
                       </button>
                       <button 
                         onClick={() => setZoomedImage(selected.afterImage)}
                         className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[8px] font-black text-white hover:bg-white/20 transition-all border border-white/10"
                       >
                         후 확대
                       </button>
                    </div>
                  </div>
                </div>

                {/* Simplified AI Scorecard */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center">
                      <Sparkles className="w-4 h-4 text-primary-600 mr-3" />
                      AI 운영 평가 결과
                    </h4>
                  </div>
                  <div className="bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-primary-500/10 to-transparent pointer-events-none" />
                    <div className="relative flex flex-col items-center md:items-start text-center md:text-left">
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-4">FINAL OPERATIONAL RATING</span>
                      <div className="flex items-end gap-5">
                        <span className={`text-8xl sm:text-[120px] leading-none font-black ${getGradeColor(getGradeFromScore(selected.achievementScore || 0))}`}>
                          {getGradeFromScore(selected.achievementScore || 0)}
                        </span>
                        <div className="flex flex-col pb-4 shrink-0">
                          <span className="text-2xl sm:text-4xl font-black text-white">{selected.achievementScore || 0}</span>
                          <span className="text-[9px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest">Points</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-px w-full md:h-32 md:w-px bg-white/10 relative z-10" />

                    <div className="relative flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-2">분석 프로토콜</span>
                        <span className="text-lg font-black text-white truncate max-w-full block">{selected.category}</span>
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

                {/* Checklist Results */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-3" />
                      업무 표준 준수 검증
                    </h4>
                    <div className="h-px flex-1 bg-slate-100 ml-6" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(selected.checklist).map(([item, checked]) => (
                      <div key={item} className={`flex items-center space-x-4 p-4 rounded-2xl border-2 transition-all duration-300 ${
                        checked 
                          ? 'bg-white border-green-100 shadow-lg shadow-green-100/50' 
                          : 'bg-slate-50 border-slate-100 opacity-60'
                      }`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-sm ${checked ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                          {checked ? <Check className="w-4 h-4" strokeWidth={4} /> : <Clock className="w-3.5 h-3.5" />}
                        </div>
                        <span className={`text-xs font-black uppercase tracking-wider ${checked ? 'text-slate-900' : 'text-slate-400'}`}>{item}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          ) : (
            <div className="h-full min-h-[600px] bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-16 text-center text-slate-400">
              <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-slate-200/50">
                <Filter className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">상세 기록 정보</h3>
              <p className="font-medium text-sm max-w-xs leading-relaxed">
                기록 보관소에서 업무 기록을 선택하여 성과 분석 및 시각적 비교를 시작하십시오.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
