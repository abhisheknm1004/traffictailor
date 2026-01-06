
import React, { useState, useEffect } from 'react';
import { WebsiteContext, HistoryItem } from './types';
import { generateMockWebsiteData } from './services/geminiService';
import MetricCard from './components/MetricCard';
import ChatInterface from './components/ChatInterface';
import LeadForm from './components/LeadForm';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [context, setContext] = useState<WebsiteContext | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showMobileStats, setShowMobileStats] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [autoQuery, setAutoQuery] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('tt_audit_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (data: WebsiteContext) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      url: data.url,
      timestamp: Date.now(),
      data
    };
    const updated = [newItem, ...history.filter(h => h.url !== data.url)].slice(0, 10);
    setHistory(updated);
    localStorage.setItem('tt_audit_history', JSON.stringify(updated));
  };

  const triggerAnalysis = (query: string) => {
    setAutoQuery(query);
    if (showMobileStats) setShowMobileStats(false);
  };

  const validateUrl = (url: string) => {
    const socialPlatforms = ['instagram.com', 'facebook.com', 'linkedin.com', 'twitter.com', 'tiktok.com', 'youtube.com'];
    const lowerUrl = url.toLowerCase();
    
    const isSocial = socialPlatforms.some(platform => lowerUrl.includes(platform));
    if (isSocial) {
      return "Audit restricted to professional websites only. Social media profiles are not supported.";
    }

    const hasDot = url.includes('.');
    if (!hasDot || url.length < 4) {
      return "Please enter a valid website domain (e.g., mysite.com).";
    }

    return null;
  };

  const handleScan = async (e: React.FormEvent, manualUrl?: string) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    
    const targetUrl = manualUrl || input;
    const validationError = validateUrl(targetUrl);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsScanning(true);
    await new Promise(r => setTimeout(r, 1500));
    
    const normalizedUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
    const mockData = generateMockWebsiteData(normalizedUrl);
    mockData.timestamp = Date.now();
    
    setContext(mockData);
    saveToHistory(mockData);
    setIsScanning(false);
    setInput('');
    setIsHistoryExpanded(false);
  };

  const trafficData = context ? [
    { name: 'Organic', value: context.traffic.sources.organic, fill: '#4f46e5' },
    { name: 'Social', value: context.traffic.sources.social, fill: '#818cf8' },
    { name: 'Paid', value: context.traffic.sources.paid, fill: '#c7d2fe' },
    { name: 'Direct', value: context.traffic.sources.direct, fill: '#e2e8f0' },
  ] : [];

  const socialBreakdownData = context ? [
    { name: 'Meta', value: context.traffic.socialBreakdown.meta, fill: '#1877F2' },
    { name: 'Google', value: context.traffic.socialBreakdown.google, fill: '#DB4437' },
    { name: 'TikTok', value: context.traffic.socialBreakdown.tiktok, fill: '#000000' },
    { name: 'LinkedIn', value: context.traffic.socialBreakdown.linkedin, fill: '#0A66C2' },
    { name: 'Other', value: context.traffic.socialBreakdown.other, fill: '#94a3b8' },
  ] : [];

  const HistorySection = () => (
    <div className="mb-6">
      <button 
        onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
        className="w-full flex items-center justify-between px-2 py-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Recent Audits</span>
        </div>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={3} 
          stroke="currentColor" 
          className={`w-3 h-3 text-slate-400 transition-transform duration-300 ${isHistoryExpanded ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isHistoryExpanded && (
        <div className="mt-2 space-y-1 animate-in slide-in-from-top-2 duration-300">
          {history.length === 0 ? (
            <p className="text-[10px] text-slate-400 italic px-4 py-2">No history yet.</p>
          ) : (
            history.map(item => (
              <button
                key={item.id}
                onClick={() => handleScan(undefined as any, item.url)}
                className={`w-full text-left p-3 rounded-xl transition-all group flex items-center gap-3 ${context?.url === item.url ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-white'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${context?.url === item.url ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                <div className="overflow-hidden">
                  <p className="text-[11px] font-bold text-slate-700 truncate">{item.url.replace('https://', '')}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );

  const StatsContent = () => context && (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-xl shadow-indigo-100">TT</div>
          <div>
            <h1 className="font-black text-xl text-slate-800 tracking-tight">Diagnostic Hub</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md uppercase tracking-wider border border-indigo-100">{context.platform}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Platform Detected</span>
            </div>
          </div>
        </div>
      </div>

      <HistorySection />

      <section>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-1">Performance Vitals <span className="text-slate-300 font-medium">(Click to Analyze)</span></h3>
        <div className="grid grid-cols-2 gap-3">
          <div onClick={() => triggerAnalysis(`Analyze my LCP score of ${(context.metrics.lcp / 1000).toFixed(1)}s on my ${context.platform} site. Why is it failing and how do I fix it?`)} className="cursor-pointer active:scale-95 transition-transform">
            <MetricCard 
              label="LCP" 
              value={`${(context.metrics.lcp / 1000).toFixed(1)}s`} 
              status={context.metrics.lcp < 2500 ? 'good' : 'poor'} 
            />
          </div>
          <div onClick={() => triggerAnalysis(`Analyze my CLS score of ${context.metrics.cls.toFixed(2)}. What layout shifts are hurting ${context.platform} conversions?`)} className="cursor-pointer active:scale-95 transition-transform">
            <MetricCard 
              label="CLS" 
              value={context.metrics.cls.toFixed(2)} 
              status={context.metrics.cls < 0.1 ? 'good' : 'needs-improvement'} 
            />
          </div>
          <div onClick={() => triggerAnalysis(`Analyze my overall speed score of ${context.metrics.speedScore}. How do I reach 90+ on ${context.platform}?`)} className="cursor-pointer active:scale-95 transition-transform">
            <MetricCard 
              label="Overall" 
              value={context.metrics.speedScore} 
              status={context.metrics.speedScore >= 90 ? 'good' : context.metrics.speedScore >= 50 ? 'needs-improvement' : 'poor'} 
            />
          </div>
          <div onClick={() => triggerAnalysis(`Analyze my INP of ${Math.round(context.metrics.inp)}ms. Is it affecting my ${context.platform} interactivity?`)} className="cursor-pointer active:scale-95 transition-transform">
            <MetricCard 
              label="INP" 
              value={`${Math.round(context.metrics.inp)}ms`} 
              status={context.metrics.inp < 200 ? 'good' : 'needs-improvement'} 
            />
          </div>
        </div>
      </section>

      <section className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Traffic Channel Deep-Dive</h3>
        <div className="flex flex-col gap-6">
          <div className="h-40 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={trafficData} 
                  dataKey="value" 
                  innerRadius={35} 
                  outerRadius={55} 
                  paddingAngle={5} 
                  stroke="none"
                  onClick={(data) => triggerAnalysis(`Analyze my ${data.name} traffic source on ${context.platform}. How do I optimize its conversion rate?`)}
                >
                  {trafficData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} className="cursor-pointer hover:opacity-80 transition-opacity" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-4">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Detailed Social Sources</p>
            <div className="grid grid-cols-2 gap-2">
              {socialBreakdownData.map(d => (
                <button 
                  key={d.name} 
                  onClick={() => triggerAnalysis(`Analyze my ${d.name} social traffic Specifically. How is this segment performing on my ${context.platform} site compared to industry benchmarks?`)}
                  className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-100 hover:border-indigo-200 transition-all text-left group"
                >
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }}></div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{d.name}</span>
                    <span className="text-xs font-black text-slate-900">{d.value}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Growth Blockers</h3>
          <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">CRITICAL</span>
        </div>
        <div className="space-y-3">
          {context.detectedIssues.map((issue, idx) => (
            <button 
              key={idx} 
              onClick={() => triggerAnalysis(`Give me a detailed fix roadmap for this issue: "${issue}" on my ${context.platform} site.`)}
              className="w-full flex gap-4 items-center p-4 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all group text-left"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 group-hover:scale-125 transition-transform"></div>
              <div className="flex-1">
                <p className="text-[13px] text-slate-700 font-bold leading-tight tracking-tight">{issue}</p>
                <p className="text-[9px] font-black text-indigo-500 uppercase mt-1 tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Analyze Fix →</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );

  if (!context) {
    return (
      <div className="h-screen w-full flex bg-white overflow-hidden">
        <div className="hidden lg:flex w-72 border-r border-slate-100 flex-col p-8 bg-slate-50/30">
          <div className="mb-10">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white mb-4 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <h1 className="text-xl font-black text-slate-900">TrafficTailor</h1>
          </div>
          <HistorySection />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          <div className="max-w-2xl w-full text-center space-y-12">
            <div className="inline-flex relative group">
              <div className="absolute -inset-8 bg-indigo-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1000"></div>
              <div className="w-28 h-28 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-100 animate-in zoom-in-75 duration-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-14 h-14">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
            </div>
            
            <div className="space-y-6">
              <h1 className="text-7xl font-black text-slate-900 tracking-tighter">TrafficTailor</h1>
              <p className="text-2xl text-slate-500 max-w-lg mx-auto leading-relaxed font-bold tracking-tight">
                Professional Website Growth AI. Enter a URL to begin audit.
              </p>
            </div>
            
            <div className="max-w-xl mx-auto w-full">
              <form onSubmit={handleScan} className="relative mb-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter Website URL (e.g. apple.com)..."
                  className={`w-full bg-slate-50 border ${errorMessage ? 'border-rose-300 ring-rose-500/10 ring-4' : 'border-slate-200'} rounded-[2rem] px-10 py-7 text-xl font-bold shadow-inner focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300`}
                  disabled={isScanning}
                />
                <button
                  type="submit"
                  disabled={isScanning || !input}
                  className="absolute right-3.5 top-3.5 bottom-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-black px-10 rounded-2xl transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
                >
                  {isScanning ? "Scanning..." : "Audit Site"}
                </button>
              </form>
              {errorMessage && (
                <p className="text-rose-600 font-bold text-sm animate-in fade-in slide-in-from-top-2 duration-300 text-center">
                  {errorMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden relative">
      <LeadForm isOpen={isLeadFormOpen} onClose={() => setIsLeadFormOpen(false)} siteUrl={context.url} />

      {/* Desktop Navigation & History */}
      <aside className="w-[380px] border-r border-slate-100 bg-white overflow-hidden flex flex-col hidden lg:flex">
        <div className="flex-1 overflow-y-auto p-8">
          <StatsContent />
        </div>
      </aside>

      {/* Main Content Area - Large and expansive */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Header Section */}
        <header className="px-6 py-4 lg:px-10 border-b border-slate-100 bg-white z-30">
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md uppercase tracking-widest border border-indigo-100">Growth Analysis: Active</span>
              </div>
              <span className="text-sm lg:text-base font-black text-slate-900 tracking-tight truncate max-w-[200px] sm:max-w-md">{context.url}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setContext(null)}
                className="flex items-center gap-1.5 text-[9px] font-black text-white bg-indigo-600 uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-100 hover:bg-indigo-700 active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Audit
              </button>
              <button 
                onClick={() => setIsLeadFormOpen(true)}
                className="bg-slate-900 text-white text-[9px] font-black px-4 py-2 rounded-xl hover:bg-black transition-all shadow-md active:scale-95"
              >
                Talk to Expert
              </button>
              <button 
                onClick={() => setShowMobileStats(!showMobileStats)}
                className="lg:hidden p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-600 active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Chat Component fills the remaining screen */}
        <div className="flex-1 flex flex-col min-h-0">
          <ChatInterface context={context} prefillInput={autoQuery} onQueryHandled={() => setAutoQuery(null)} />
        </div>
      </main>

      {/* Mobile drawer */}
      {showMobileStats && (
        <div className="lg:hidden fixed inset-0 z-50 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowMobileStats(false)}></div>
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-xs bg-white shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-500 ease-out rounded-l-[2rem]">
            <div className="flex justify-between items-center mb-8">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs">TT</div>
              <button onClick={() => setShowMobileStats(false)} className="p-2 bg-slate-50 rounded-lg text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <StatsContent />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
