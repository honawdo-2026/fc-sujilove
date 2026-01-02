
import React, { useState, useEffect, useRef } from 'react';
import { Member, PointData, MatchSchedule, Quarter } from './types';
import { analyzeScheduleImage } from './services/geminiService';
import ElectronicScoreboard from './components/ElectronicScoreboard';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pw, setPw] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [points, setPoints] = useState<PointData>({});
  const [selQ, setSelQ] = useState<number>(1);
  const [selM, setSelM] = useState<number>(1);
  const [selW, setSelW] = useState<number>(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nextMatch, setNextMatch] = useState<MatchSchedule | null>(null);
  const [allMatches, setAllMatches] = useState<MatchSchedule[]>([]);
  
  // Manual Input State
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualForm, setManualForm] = useState<MatchSchedule>({
    date: '',
    venue: '',
    time: '',
    opponents: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('fc_suji_data');
    if (saved) {
      const { members: m, points: p } = JSON.parse(saved);
      setMembers(m || []);
      setPoints(p || {});
    } else {
      setMembers([
        { id: 1, name: '수지A (대표)' },
        { id: 2, name: '수지B' },
        { id: 3, name: '수지C' }
      ]);
    }
  }, []);

  const handleLogin = () => {
    if (pw === '2025') {
      setIsLoggedIn(true);
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      setSelM(currentMonth);
      setSelQ(Math.ceil(currentMonth / 3));
    } else {
      alert('비밀번호가 일치하지 않습니다.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    // Note: We do NOT clear nextMatch here immediately to allow manual override persistence if needed, 
    // but usually upload replaces everything. Let's clear for fresh start.
    setNextMatch(null); 
    setAllMatches([]);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const schedules = await analyzeScheduleImage(base64);
        console.log("Analyzed Data:", schedules);

        // Calculate a simple sort value based on Month and Day (ignoring year)
        const getSortValue = (dateStr: string) => {
           const nums = dateStr.match(/\d+/g)?.map(Number);
           if (!nums || nums.length < 2) return 9999;
           
           // Strategy: If 3 nums (YYYY-MM-DD), take last 2. If 2 nums (MM-DD), take them.
           const m = nums.length >= 3 ? nums[1] : nums[0];
           const d = nums.length >= 3 ? nums[2] : nums[1];
           
           return m * 100 + d;
        };

        if (schedules.length > 0) {
          // Sort by "Month * 100 + Day" to keep chronological order within a year
          schedules.sort((a, b) => getSortValue(a.date) - getSortValue(b.date));
          
          setNextMatch(schedules[0]);
          setAllMatches(schedules);
        } else {
          alert('일정을 추출할 수 없습니다. 이미지 품질을 확인해주세요.');
        }
      } catch (err) {
        console.error("AI Analysis Error:", err);
        alert('이미지 분석 중 오류가 발생했습니다.');
      } finally {
        setIsAnalyzing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = () => {
    if (!manualForm.date || !manualForm.venue) {
      alert('날짜와 장소를 입력해주세요.');
      return;
    }
    // Update nextMatch with manual data
    setNextMatch({ ...manualForm });
    setShowManualInput(false);
    
    // Reset form optionally, or keep it for corrections. Let's keep it.
  };

  const getCumulativeScore = (memberId: number) => {
    let total = 0;
    const monthsInQuarter = selQ === 1 ? [1,2,3] : selQ === 2 ? [4,5,6] : selQ === 3 ? [7,8,9] : [10,11,12];
    for (let m of monthsInQuarter) {
      if (m > selM) break;
      for (let w = 1; w <= 5; w++) {
        if (m === selM && w > selW) break;
        const key = `${selQ}-${m}-${w}-${memberId}`;
        if (points[key]) {
          total += (points[key].a || 0) + (points[key].t || 0);
        }
      }
    }
    return total;
  };

  // Helper to get last date
  const lastMatchDate = allMatches.length > 0 ? allMatches[allMatches.length - 1].date : '';

  // Login View
  if (!isLoggedIn) {
    return (
      <section className="fixed inset-0 z-[1000] flex flex-col items-center justify-start p-6 overflow-y-auto bg-[#0a0f1e]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#065f46] to-[#012e23] opacity-80"></div>
        
        <div className="relative w-full max-w-[440px] z-10 space-y-8 pt-10 pb-20">
          <div className="bg-white/95 backdrop-blur-xl p-9 rounded-[48px] text-center shadow-2xl border border-white/20">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto rounded-full mb-5 bg-emerald-100 flex items-center justify-center border-[6px] border-white shadow-xl overflow-hidden">
                 <img src="https://picsum.photos/id/1023/200/200" alt="FC Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="app-title-main text-3xl font-[1000] italic tracking-tight">FC 수지사랑</h1>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1.5">Elite Point Management</p>
            </div>
            
            <div className="space-y-4">
              <input 
                type="password" 
                inputMode="numeric"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="접속 암호 입력" 
                className="w-full h-16 bg-slate-100 rounded-3xl text-center text-2xl font-black border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button 
                onClick={handleLogin}
                className="w-full h-16 bg-emerald-600 text-white rounded-3xl font-black text-xl shadow-xl shadow-emerald-900/40 active:scale-95 transition-all"
              >
                관리자 접속
              </button>
              
              <button 
                className="w-full h-16 bg-white text-emerald-700 border-2 border-emerald-700 rounded-3xl font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                <svg width="20" height="28" viewBox="0 0 18 26" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="1" width="16" height="24" rx="1" ry="1"></rect><line x1="1" y1="13" x2="17" y2="13"></line><circle cx="9" cy="13" r="3.5"></circle></svg>
                전술판 바로가기
              </button>

              <div className="pt-4 border-t border-slate-100 mt-6 space-y-4">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                />
                
                {/* Buttons Row */}
                <div className="flex gap-3">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAnalyzing}
                    className={`flex-1 h-14 ${isAnalyzing ? 'bg-slate-400' : 'bg-slate-900'} text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-slate-900/20`}
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center gap-2">
                         <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                         분석 중
                      </span>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        경기일정 업로드
                      </>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => setShowManualInput(!showManualInput)}
                    className="flex-1 h-14 bg-indigo-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-900/20"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    자체 일정
                  </button>
                </div>

                {/* Manual Input Form */}
                {showManualInput && (
                  <div className="bg-slate-50 p-5 rounded-3xl border border-indigo-100 shadow-inner animate-fade-in-down space-y-4 text-left">
                    {/* Row 1: Date & Time */}
                    <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1.5">
                         <span className="text-[11px] font-black text-slate-400 pl-1 uppercase tracking-wider block">날짜</span>
                         <input 
                           value={manualForm.date}
                           onChange={(e) => setManualForm({...manualForm, date: e.target.value})}
                           placeholder="1월 1일"
                           className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors"
                         />
                       </div>
                       <div className="space-y-1.5">
                         <span className="text-[11px] font-black text-slate-400 pl-1 uppercase tracking-wider block">시간</span>
                         <input 
                           value={manualForm.time}
                           onChange={(e) => setManualForm({...manualForm, time: e.target.value})}
                           placeholder="08:00"
                           className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors"
                         />
                       </div>
                    </div>

                    {/* Row 2: Venue, Opponents, Button */}
                    <div className="flex gap-2 items-end">
                       <div className="space-y-1.5 flex-1">
                         <span className="text-[11px] font-black text-slate-400 pl-1 uppercase tracking-wider block">장소</span>
                         <input 
                           value={manualForm.venue}
                           onChange={(e) => setManualForm({...manualForm, venue: e.target.value})}
                           placeholder="구장명"
                           className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors"
                         />
                       </div>

                       <div className="space-y-1.5 flex-1">
                         <span className="text-[11px] font-black text-slate-400 pl-1 uppercase tracking-wider block">상대팀</span>
                         <input 
                           value={manualForm.opponents}
                           onChange={(e) => setManualForm({...manualForm, opponents: e.target.value})}
                           placeholder="팀명"
                           className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors"
                         />
                       </div>

                       <button 
                         onClick={handleManualSubmit}
                         className="h-11 px-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-md active:scale-95 transition-all whitespace-nowrap mb-px"
                       >
                         확인
                       </button>
                    </div>
                  </div>
                )}

                {/* ELECTRONIC SCOREBOARD */}
                {nextMatch && (
                  <div className="pt-2">
                    <ElectronicScoreboard schedule={nextMatch} />
                  </div>
                )}

                {/* FULL SCHEDULE TABLE (LOGIN SCREEN) */}
                {allMatches.length > 0 && (
                  <div className="pt-4 animate-fade-in-up">
                     <div className="bg-slate-50/80 backdrop-blur-md rounded-3xl border border-slate-200 overflow-hidden shadow-lg">
                       <div className="px-5 py-3 border-b border-slate-200/60 bg-white/50 flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                         <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                           예정 일정 {lastMatchDate ? `(~${lastMatchDate})` : `(${allMatches.length})`}
                         </h3>
                       </div>
                       <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                         <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-200/60 sticky top-0 z-10 backdrop-blur-sm">
                              <tr>
                                <th className="py-2 px-4 text-[11px] whitespace-nowrap text-center">날짜</th>
                                <th className="py-2 px-2 text-[11px] whitespace-nowrap text-center">장소</th>
                                <th className="py-2 px-2 text-[11px] whitespace-nowrap text-center">시간</th>
                                <th className="py-2 px-4 text-[11px] whitespace-nowrap text-center">상대팀</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/60">
                              {allMatches.map((match, idx) => (
                                <tr key={idx} className="hover:bg-white/80 transition-colors">
                                  <td className="py-3 px-4 font-black text-slate-700 text-xs whitespace-nowrap text-center">{match.date}</td>
                                  <td className="py-3 px-2 font-bold text-slate-500 text-[11px] whitespace-nowrap text-center">{match.venue}</td>
                                  <td className="py-3 px-2 font-bold text-slate-500 text-[11px] whitespace-nowrap text-center">{match.time}</td>
                                  <td className="py-3 px-4 font-bold text-slate-600 text-xs text-right whitespace-nowrap">{match.opponents}</td>
                                </tr>
                              ))}
                            </tbody>
                         </table>
                       </div>
                     </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // App Main View
  const ms = selQ === 1 ? [1,2,3] : selQ === 2 ? [4,5,6] : selQ === 3 ? [7,8,9] : [10,11,12];
  
  return (
    <div className="min-h-screen pb-32 bg-slate-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 p-5 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Manager Mode</span>
            <span className="app-title-main text-lg font-[1000] italic">FC 수지사랑</span>
          </div>
          <button onClick={() => setIsLoggedIn(false)} className="text-[11px] bg-slate-900 text-white px-5 py-2.5 rounded-full font-black shadow-lg shadow-slate-900/20 active:scale-95">로그아웃</button>
        </div>

        <div className="space-y-3.5">
          <div className="grid grid-cols-4 gap-2.5">
            {[1, 2, 3, 4].map(q => (
              <button 
                key={q} 
                onClick={() => setSelQ(q)}
                className={`h-11 rounded-2xl font-black text-sm transition-all border-2 ${selQ === q ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
              >
                {q}분기
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {ms.map(m => (
              <button 
                key={m} 
                onClick={() => setSelM(m)}
                className={`h-11 rounded-2xl font-black text-sm transition-all border-2 ${selM === m ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
              >
                {m}월
              </button>
            ))}
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
            {[1, 2, 3, 4, 5].map(w => (
              <button 
                key={w} 
                onClick={() => setSelW(w)}
                className={`min-w-[72px] h-10 rounded-2xl font-black text-[13px] transition-all border-2 ${selW === w ? 'bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-200' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
              >
                {w}주
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="p-6 max-w-[500px] mx-auto">
        {nextMatch && (
          <div className="mb-10 space-y-4">
             <div className="flex items-center gap-3 ml-2">
               <div className="w-2 h-5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
               <h3 className="text-[13px] font-[1000] text-slate-600 uppercase tracking-[0.2em]">이번주 경기안내</h3>
             </div>
             <ElectronicScoreboard schedule={nextMatch} />
          </div>
        )}

        {/* FULL SCHEDULE TABLE */}
        {allMatches.length > 0 && (
          <div className="mb-10">
             <div className="flex items-center gap-3 ml-2 mb-3">
               <div className="w-2 h-5 bg-slate-800 rounded-full"></div>
               <h3 className="text-[13px] font-[1000] text-slate-800 uppercase tracking-[0.2em]">
                 예정 일정 {lastMatchDate ? `(~${lastMatchDate})` : ''}
               </h3>
             </div>
             <div className="bg-white rounded-[24px] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50">
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <tr>
                      <th className="py-4 px-5 text-[13px] text-center">날짜</th>
                      <th className="py-4 px-2 text-[13px] text-center">장소</th>
                      <th className="py-4 px-2 text-[13px] text-center">시간</th>
                      <th className="py-4 px-5 text-[13px] text-center">상대팀</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allMatches.map((match, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-5 font-black text-slate-700 text-center">{match.date}</td>
                        <td className="py-4 px-2 font-medium text-slate-500 text-xs text-center">{match.venue}</td>
                        <td className="py-4 px-2 font-medium text-slate-500 text-xs text-center">{match.time}</td>
                        <td className="py-4 px-5 font-bold text-slate-600 text-center">{match.opponents}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
          </div>
        )}

        <div className="flex items-center gap-4 mb-8 bg-white p-5 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="w-12 h-12 rounded-[20px] bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <h2 className="text-[17px] font-black text-slate-800 tracking-tight flex-1 italic leading-tight">
            2025년 {selQ}분기 {selM}월 {selW}주차<br/><span className="text-sm font-bold text-slate-400 not-italic">팀 포인트 누적 현황</span>
          </h2>
        </div>

        <div className="space-y-5">
          {members.map(m => {
            const cum = getCumulativeScore(m.id);
            return (
              <div key={m.id} className="bg-white p-6 rounded-[36px] flex items-center justify-between border border-slate-100 shadow-lg shadow-slate-200/40 transition-transform active:scale-[0.97]">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center text-2xl shadow-inner ${cum >= 20 ? 'bg-yellow-50 text-yellow-600' : 'bg-slate-50 text-slate-400'}`}>
                    {cum >= 20 ? '🏆' : '👑'}
                  </div>
                  <div>
                    <div className="text-[19px] font-black text-slate-800 leading-tight tracking-tight">{m.name}</div>
                    <div className="text-[14px] font-black text-indigo-500 mt-1">{cum} Points</div>
                  </div>
                </div>
                <button className="w-16 h-16 rounded-[24px] font-black text-[13px] bg-slate-100 text-slate-400 border-2 border-slate-200 transition-all active:bg-slate-200">
                  참석
                </button>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating System Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-[420px] h-20 bg-slate-900/95 backdrop-blur-2xl rounded-[32px] flex items-center justify-between px-8 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] z-[100] border border-white/10">
          <button onClick={() => setNextMatch(null)} className="text-white/30 hover:text-white transition-colors p-2">
             <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
          </button>
          
          <button onClick={() => fileInputRef.current?.click()} className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-500/50 border-[5px] border-slate-900 scale-125 -translate-y-5 hover:bg-emerald-400 transition-all active:scale-110">
             <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          </button>

          <button onClick={() => setIsLoggedIn(false)} className="text-white/30 hover:text-white transition-colors p-2">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline></svg>
          </button>
      </div>
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
      />
    </div>
  );
};

export default App;
