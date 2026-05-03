import React, { useState, useRef, useEffect } from 'react';
import { Category, UserProfile } from '../types';
import { auth } from '../lib/firebase';
import { aiService } from '../services/aiService';
import { storageService } from '../services/storageService';
import { imageService } from '../services/imageService';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, Check, Trash2, Loader2, Sparkles, AlertCircle, ChevronDown, X } from 'lucide-react';

interface ComparisonFormProps {
  profile: UserProfile;
  category: Category;
  onComplete: () => void;
}

export const ComparisonForm: React.FC<ComparisonFormProps> = ({ profile, category, onComplete }) => {
  const [selectedArea, setSelectedArea] = useState(category.areas[0] || '');
  const [subject, setSubject] = useState('');
  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    category.defaultChecklist.reduce((acc, item) => ({ ...acc, [item]: false }), {})
  );
  const [beforeImages, setBeforeImages] = useState<string[]>([]);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggingType, setDraggingType] = useState<'before' | 'after' | null>(null);
  const [selectedModel, setSelectedModel] = useState(aiService.DEFAULT_MODEL);

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'before' | 'after' | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (showCamera && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [showCamera, cameraStream]);

  const startCamera = async (target: 'before' | 'after') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setCameraStream(stream);
      setCameraTarget(target);
      setShowCamera(true);
    } catch (err) {
      console.error("Camera access failed:", err);
      setError("카메라 권한이 필요합니다.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setCameraTarget(null);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !cameraTarget) return;

    try {
      setLoading(true);
      const rawBase64 = imageService.captureFrame(videoRef.current);
      const processed = await imageService.processForStorage(rawBase64, {
        email: profile?.email || '',
        name: profile?.displayName || ''
      });
      
      if (cameraTarget === 'before') {
        setBeforeImages(prev => [...prev, processed].slice(-5));
      } else {
        setAfterImage(processed);
      }
      stopCamera();
    } catch (err) {
      setError("이미지 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const processFiles = (files: FileList | File[], type: 'before' | 'after') => {
    Array.from(files).forEach(async (file) => {
      if (!file.type.startsWith('image/')) return;
      try {
        const base64 = await imageService.fileToBase64(file);
        const processed = await imageService.processForStorage(base64, {
          email: profile?.email || '',
          name: profile?.displayName || ''
        });
        
        if (type === 'before') {
          setBeforeImages(prev => [...prev, processed].slice(-5));
        } else {
          setAfterImage(processed);
        }
      } catch (err) {
        setError("이미지 처리 중 오류가 발생했습니다.");
      }
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    if (e.target.files) processFiles(e.target.files, type);
  };

  const onDragOver = (e: React.DragEvent, type: 'before' | 'after') => {
    e.preventDefault();
    setDraggingType(type);
  };

  const onDragLeave = () => {
    setDraggingType(null);
  };

  const onDrop = (e: React.DragEvent, type: 'before' | 'after') => {
    e.preventDefault();
    setDraggingType(null);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files, type);
    }
  };

  const toggleCheck = (item: string) => {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const handleSubmit = async () => {
    if (beforeImages.length === 0 || !afterImage) {
      setError("Before 및 After 이미지를 모두 등록해주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const completedItems = Object.entries(checklist)
        .filter(([_, checked]) => checked)
        .map(([name]) => name);
      
      const analysis = await aiService.analyzeComparison(
        beforeImages[0], // Use first for now if focused on single pair, or service could handle multiple
        afterImage, 
        category.name,
        selectedArea,
        completedItems, 
        selectedModel
      );

      const aiFeedback = analysis.feedback;
      const achievementScore = analysis.score || 0;

      await storageService.saveComparison({
        staffId: profile?.uid || 'anonymous',
        staffEmail: profile?.email || '',
        zone: category.zone || 'Default',
        category: category.name,
        area: selectedArea,
        subject: subject,
        checklist,
        beforeImages,
        afterImage,
        aiFeedback,
        achievementScore,
        improvements: analysis.improvements || [],
        risks: analysis.risks || [],
        modelVersion: selectedModel,
        status: 'completed',
      });

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
      <div className="p-4 sm:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-black text-primary-500 uppercase tracking-[0.2em] bg-primary-50 px-2 py-0.5 rounded border border-primary-100">{category.zone}</span>
            <div className="h-px w-4 bg-slate-200" />
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">SOP #{category.order || 0}01</p>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{category.name} <span className="text-primary-600">성과 기록</span></h3>
        </div>
        
        <div className="relative w-full lg:w-auto grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-4">
          {profile?.role === 'manager' && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">분석 엔진 (AI Model)</span>
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                {aiService.MODEL_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedModel(opt.id)}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                      selectedModel === opt.id 
                        ? 'bg-primary-900 text-white shadow-lg shadow-primary-900/20' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {opt.name.split(' ')[1]} {opt.name.split(' ')[2]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="relative">
            <input 
              type="text"
              placeholder="기록 대상 / 식별번호"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full sm:w-48 bg-white border border-slate-200 rounded-xl px-5 py-2.5 text-xs font-black text-slate-700 uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm placeholder:text-slate-300"
            />
          </div>

          <div className="relative">
            <select 
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-white border border-slate-200 rounded-xl px-5 py-2.5 pr-12 text-xs font-black text-slate-700 uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all cursor-pointer shadow-sm"
            >
            {category.areas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </div>

      <div className="p-4 sm:p-8 space-y-8 sm:space-y-12">
        {/* Checklist */}
        <section className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-slate-100 gap-3">
            <h4 className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-pulse" />
              업무 체크리스트
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[9px] sm:text-[10px] font-black text-white bg-slate-800 px-3 py-1 rounded-full uppercase">
                준수율: {Object.values(checklist).filter(Boolean).length} / {Object.keys(checklist).length}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.defaultChecklist.map(item => (
              <button
                key={item}
                onClick={() => toggleCheck(item)}
                className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-left group ${
                  checklist[item] 
                    ? 'bg-primary-50 border-primary-200 shadow-sm' 
                    : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    checklist[item] 
                      ? 'bg-primary-600 border-primary-600 text-white' 
                      : 'bg-white border-slate-200 text-transparent group-hover:border-primary-300'
                  }`}>
                    <Check className="w-3.5 h-3.5" strokeWidth={4} />
                  </div>
                  <span className={`text-sm font-bold ${checklist[item] ? 'text-primary-900' : 'text-slate-600'}`}>
                    {item}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Images */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Before Images */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                정리 전 (기준)
              </h4>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => beforeInputRef.current?.click()}
                  className="flex items-center gap-2 text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 transition-colors bg-white px-3 py-1.5 rounded-lg border border-primary-100 shadow-sm"
                >
                  <Upload className="w-3 h-3" />
                  파일 업로드
                </button>
                <span className="text-[10px] font-bold text-slate-400">최대 5개</span>
              </div>
            </div>
            
            <div className="relative">
              <motion.div 
                animate={{ 
                  scale: draggingType === 'before' ? 1.01 : 1,
                  backgroundColor: draggingType === 'before' ? 'rgba(59, 130, 246, 0.03)' : 'rgba(255, 255, 255, 0)'
                }}
                className={`min-h-[200px] transition-all rounded-3xl border-2 border-dashed ${
                  draggingType === 'before' 
                    ? 'border-primary-500 bg-primary-50/30 shadow-2xl shadow-primary-500/10' 
                    : beforeImages.length === 0 ? 'border-slate-200 bg-slate-50/30' : 'border-transparent'
                }`}
                onDragOver={(e) => onDragOver(e, 'before')}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, 'before')}
              >
                {beforeImages.length === 0 ? (
                  <div 
                    onClick={() => beforeInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-6 sm:p-12 cursor-pointer group transition-all"
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white border border-slate-200 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all mb-4">
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300 group-hover:text-primary-400" />
                    </div>
                    <p className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest group-hover:text-primary-600 text-center px-4">이곳을 클릭하거나 파일 드래그</p>
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-300 mt-2 uppercase text-center">정리 전 상태 증명 사진 등록</p>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); startCamera('before'); }}
                      className="mt-6 flex items-center gap-2 bg-slate-900 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg active:scale-95"
                    >
                      <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      직접 촬영하기
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 p-2">
                    {beforeImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border-4 border-white shadow-lg shadow-slate-200">
                        <div className="absolute top-2 left-2 z-10 bg-black/50 backdrop-blur-sm text-[8px] font-black text-white px-2 py-0.5 rounded tracking-tighter uppercase">Scan #{idx+1}</div>
                        <img src={img} alt="before" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setBeforeImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {beforeImages.length < 5 && (
                      <button 
                        onClick={() => beforeInputRef.current?.click()}
                        className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center space-y-2 text-slate-300 hover:border-primary-300 hover:bg-primary-50/30 transition-all active:scale-95 group"
                      >
                        <div className="p-2 bg-white rounded-lg border border-slate-100 group-hover:border-primary-100 transition-all">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest">추가 등록</span>
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
              
              {draggingType === 'before' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center bg-primary-600/10 backdrop-blur-[2px] rounded-3xl border-4 border-primary-500 border-dashed animate-pulse"
                >
                  <div className="bg-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
                    <Upload className="w-5 h-5 text-primary-600" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-900">파일을 놓아서 즉시 업로드</span>
                  </div>
                </motion.div>
              )}
            </div>
            <input 
              type="file" 
              ref={beforeInputRef} 
              className="hidden" 
              accept="image/*" 
              multiple 
              onChange={(e) => handleImageUpload(e, 'before')} 
            />
          </section>

          {/* After Image */}
          <section className="space-y-4">
            <h4 className="text-[11px] font-bold text-primary-500 uppercase tracking-widest flex items-center bg-primary-100/50 px-3 py-1.5 rounded-lg border border-primary-200">
               정리 후 (현재)
            </h4>
            
            <div className="relative">
              {afterImage ? (
                <motion.div 
                  animate={{ 
                    scale: draggingType === 'after' ? 1.02 : 1,
                    backgroundColor: draggingType === 'after' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255, 255, 255, 0)'
                  }}
                  className={`relative aspect-square sm:aspect-video rounded-3xl overflow-hidden group border-4 border-white shadow-2xl shadow-primary-900/10 transition-all ${draggingType === 'after' ? 'ring-4 ring-primary-500 shadow-primary-500/20' : ''}`}
                  onDragOver={(e) => onDragOver(e, 'after')}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, 'after')}
                >
                  <div className="absolute top-4 left-4 z-10 bg-primary-600 text-[10px] font-black text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">최근 작업 사진</div>
                  <img src={afterImage} alt="after" className="w-full h-full object-cover" />
                  
                  {loading && (
                    <motion.div 
                      initial={{ top: '-10%' }}
                      animate={{ top: '110%' }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                      className="absolute left-0 right-0 h-[2px] bg-primary-400 shadow-[0_0_20px_#627d98] z-30"
                    />
                  )}
                  {loading && (
                    <div className="absolute inset-0 bg-primary-900/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                      <div className="bg-white/95 px-6 py-4 rounded-3xl shadow-2xl flex flex-col items-center gap-3 border border-primary-100">
                         <Loader2 className="w-6 h-6 animate-spin text-primary-900" />
                         <div className="text-center">
                           <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">정밀 이미지 분석 중</p>
                           <p className="text-[9px] font-bold text-primary-500 mt-1 uppercase tracking-widest">Vision OS v4.2.1</p>
                         </div>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => setAfterImage(null)}
                    disabled={loading}
                    className="absolute top-4 right-4 p-2.5 bg-slate-900/80 text-white rounded-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 disabled:hidden"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => startCamera('after')}
                    className="aspect-square rounded-3xl border-2 border-dashed border-primary-300 bg-primary-50/20 text-primary-400 hover:border-primary-500 hover:bg-primary-50/40 transition-all active:scale-95 shadow-inner flex flex-col items-center justify-center space-y-4"
                  >
                    <div className="w-16 h-16 bg-white border border-primary-100 rounded-3xl flex items-center justify-center shadow-lg shadow-primary-200/50">
                      <Camera className="w-8 h-8 text-primary-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-slate-800 uppercase tracking-widest">실시간 촬영</p>
                      <p className="text-[10px] font-bold text-primary-500 mt-1 uppercase opacity-60">카메라 활성화</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => afterInputRef.current?.click()}
                    className="aspect-square rounded-3xl border-2 border-dashed border-slate-200 bg-white text-slate-300 hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95 shadow-inner flex flex-col items-center justify-center space-y-4"
                  >
                    <div className="w-16 h-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center shadow-md">
                      <Upload className="w-8 h-8 text-slate-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">사진 불러오기</p>
                      <p className="text-[10px] font-bold text-slate-300 mt-1 uppercase">갤러리 선택</p>
                    </div>
                  </button>
                </div>
              )}

              {draggingType === 'after' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center bg-primary-600/10 backdrop-blur-[2px] rounded-3xl border-4 border-primary-500 border-dashed animate-pulse"
                >
                  <div className="bg-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-primary-600" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-900">최종 운영 표준 업데이트</span>
                  </div>
                </motion.div>
              )}
            </div>
            <input 
              type="file" 
              ref={afterInputRef} 
              className="hidden" 
              accept="image/*" 
              capture="environment"
              onChange={(e) => handleImageUpload(e, 'after')} 
            />
          </section>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 bg-red-50 border-l-4 border-red-500 rounded-r-2xl flex items-center space-x-4 text-red-700 shadow-sm"
          >
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <p className="text-[13px] font-bold tracking-tight">{error}</p>
          </motion.div>
        )}

        <div className="pt-8 border-t border-slate-100">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-6 rounded-3xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center space-x-4 transition-all shadow-2xl ${
              loading 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20 active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                <span>데이터 정밀 분석 진행 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6 text-primary-400" />
                <span>AI 보고서 생성 및 분석 결과 저장</span>
              </>
            )}
          </button>
          
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">비전 노드 활성 상태</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">개인정보 보안 준수</span>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
          >
            <div className="relative w-full h-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="absolute top-0 inset-x-0 p-8 z-30 flex justify-between items-center text-white bg-gradient-to-b from-black/80 to-transparent">
                <div>
                  <h4 className="text-lg font-black uppercase tracking-widest">{category.name}</h4>
                  <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">가이드: {
                    category.name.toLowerCase().includes('화장') || category.name.toLowerCase().includes('얼굴') ? '얼굴 정렬' : '부위별 정렬'
                  }</p>
                </div>
                <button onClick={stopCamera} className="p-4 bg-white/10 backdrop-blur-md rounded-2xl hover:bg-white/20 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 relative bg-slate-900 flex items-center justify-center overflow-hidden">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover"
                />
                
                {/* ROI Overlay */}
                <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                  {(category.name.toLowerCase().includes('화장') || category.name.toLowerCase().includes('얼굴') || category.name.toLowerCase().includes('헤어')) ? (
                    <div className="w-[280px] h-[380px] border-4 border-primary-500 rounded-[140px] shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] relative">
                      <div className="absolute inset-0 border-2 border-white/30 rounded-[140px] animate-pulse" />
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-8 w-max">
                        <span className="bg-primary-600 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest">가이드 영역 내에 얼굴을 일치시키세요</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-[300px] h-[300px] border-4 border-primary-500 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] relative">
                      <div className="absolute inset-0 border-2 border-white/30 rounded-3xl animate-pulse" />
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-8 w-max">
                        <span className="bg-primary-600 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest">가이드 영역 내에 사물을 정렬하세요</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 sm:p-12 bg-black flex justify-center items-center gap-6 sm:gap-12">
                <button 
                  onClick={stopCamera}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all shadow-lg"
                >
                  <X className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>
                <button 
                  onClick={capturePhoto}
                  disabled={loading}
                  className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all group"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 sm:border-4 border-slate-900 flex items-center justify-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-900 rounded-full group-hover:scale-90 transition-all" />
                  </div>
                </button>
                <div className="w-12 sm:w-16" /> {/* Spacer */}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
