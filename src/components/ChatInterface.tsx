
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, WebsiteContext } from '../types';
import { startTrafficTailorChat } from '../services/geminiService';
import { Chat as GeminiChat, GenerateContentResponse } from "@google/genai";

interface ChatInterfaceProps {
  context: WebsiteContext;
  prefillInput?: string | null;
  onQueryHandled?: () => void;
}

interface Suggestions {
  specific: string[];
  general: string[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ context, prefillInput, onQueryHandled }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestions>({ specific: [], general: [] });
  const chatRef = useRef<GeminiChat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const processStages = [
    "Correlating data with revenue leaks...",
    "Scanning competitive benchmarks...",
    "Identifying P0 conversion blockers...",
    "Drafting expert fix roadmap..."
  ];

  const initChat = () => {
    chatRef.current = startTrafficTailorChat(context);
    
    const lcpSec = (context.metrics.lcp / 1000).toFixed(1);
    const bounce = Math.round(context.traffic.socialQuality.bounceRate);
    
    const initialText = `AUDIT COMPLETE: ${context.url} ON ${context.platform.toUpperCase()}

7-10 CRITICAL GROWTH POINTERS:

1. PLATFORM: Detected ${context.platform} architecture—high optimization potential.
2. CORE SPEED: ${lcpSec}s LCP is currently in the "POOR" zone, causing mobile drop-offs.
3. STABILITY: ${context.metrics.cls.toFixed(2)} CLS indicates visual instability during checkout.
4. TRAFFIC LEAK: ${bounce}% bounce rate from Meta/Social channels suggests audience mismatch.
5. CHANNEL DATA: Meta (${context.traffic.socialBreakdown.meta}%) and Google (${context.traffic.socialBreakdown.google}%) are your main drivers.
6. SEO GAP: Missing Open Graph tags and over-extended title tags found in header scan.
7. MOBILITY: Touch target friction detected—potential 10% conversion lift on mobile fix.
8. INDEXING: Status is currently ${context.seo.indexability}; readiness confirmed for search scale.
9. REVENUE: Current ${context.traffic.socialQuality.conversions} conversion baseline is below industry standard.
10. NEXT ACTION: Immediate technical P0 fixes required on LCP and Meta-traffic landing pages.

⚠️ PRO IMPLEMENTATION WARNING
Attempting to fix CLS layout shifts and Mobile Viewport issues without technical expertise can break your site's layout entirely. These are code-level adjustments, not simple plugin fixes.

I strongly recommend letting the TrafficTailor team handle the technical heavy lifting.

Suggested Next Step: Book a Strategy Call with us. We will map out exactly how to bring your performance metrics in line with industry leaders to turn that ${bounce}% bounce rate into paying customers.

Note: You should first find a developer or anyone you know of; if not, connect with us for a consultation.

Where should we start the deep dive?`;

    setMessages([{ role: 'model', text: '' }]);
    setIsTyping(true);
    let currentText = '';
    const chars = initialText.split('');
    let charIndex = 0;

    const typeInterval = setInterval(() => {
      for(let i=0; i<10 && charIndex < chars.length; i++) {
        currentText += chars[charIndex];
        charIndex++;
      }
      setMessages([{ role: 'model', text: currentText }]);
      
      if (charIndex >= chars.length) {
        clearInterval(typeInterval);
        setIsTyping(false);
        setSuggestions({
          specific: [
            "🚀 How do I increase my revenue?",
            "Analyze my Meta traffic quality",
            "Fix my LCP speed issue"
          ],
          general: [
            "What is my biggest growth leak?",
            "Do I need an expert developer?",
            "Compare me to industry leaders"
          ]
        });
      }
    }, 1);
  };

  useEffect(() => {
    initChat();
  }, [context]);

  useEffect(() => {
    if (prefillInput && !isLoading && !isTyping) {
      handleSend(prefillInput);
      if (onQueryHandled) onQueryHandled();
    }
  }, [prefillInput]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isTyping, processStatus]);

  const parseSuggestedQuestions = (text: string): Suggestions => {
    const lowerText = text.toLowerCase();
    const triggerSpecific = "useful things you can ask next:";
    const triggerGeneral = "more growth questions:";
    
    const extract = (startIndex: number, endIndex?: number) => {
      const section = text.substring(startIndex, endIndex);
      return section.split('\n')
        .map(line => line.trim().replace(/^[-*•\d.\s#]+/, '').replace(/^["'“”]|["'“”]$/g, '').trim())
        .filter(line => line.endsWith('?') && line.length > 5)
        .slice(0, 3);
    };

    let specific: string[] = [];
    let general: string[] = [];

    const specificIdx = lowerText.lastIndexOf(triggerSpecific);
    const generalIdx = lowerText.lastIndexOf(triggerGeneral);

    if (specificIdx !== -1) {
      const endOfSpecific = generalIdx !== -1 ? generalIdx : undefined;
      specific = extract(specificIdx + triggerSpecific.length, endOfSpecific);
    }

    if (generalIdx !== -1) {
      general = extract(generalIdx + triggerGeneral.length);
    }

    if (specific.length === 0 && general.length === 0) {
      return {
        specific: ["🚀 How do I increase my revenue?", "Analyze Social traffic breakdown", "Fix LCP speed score"],
        general: ["What is my next growth action?", "Do I need a developer?"]
      };
    }

    return { specific, general };
  };

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || isLoading || isTyping) return;

    setInput('');
    setSuggestions({ specific: [], general: [] });
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setIsLoading(true);
    
    let stageIdx = 0;
    const statusInterval = setInterval(() => {
      setProcessStatus(processStages[stageIdx % processStages.length]);
      stageIdx++;
    }, 1500);

    try {
      if (chatRef.current) {
        const stream = await chatRef.current.sendMessageStream({ message: textToSend });
        
        let assistantResponse = '';
        setMessages(prev => [...prev, { role: 'model', text: '' }]);

        for await (const chunk of stream) {
          const contentChunk = (chunk as GenerateContentResponse).text || '';
          const cleanedChunk = contentChunk.replace(/[#*]/g, '');
          assistantResponse += cleanedChunk;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            return [...prev.slice(0, -1), { ...last, text: assistantResponse }];
          });
          setProcessStatus('');
        }
        setSuggestions(parseSuggestedQuestions(assistantResponse));
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "I encountered a minor interruption while processing your growth data." }]);
    } finally {
      clearInterval(statusInterval);
      setProcessStatus('');
      setIsLoading(false);
    }
  };

  const QuestionChip: React.FC<{ text: string, type: 'specific' | 'general' }> = ({ text, type }) => (
    <button
      onClick={() => handleSend(text)}
      className={`group flex items-center gap-2.5 text-[10px] sm:text-xs font-bold border px-4 py-3 rounded-xl transition-all text-left active:scale-95 hover:scale-[1.02] shadow-sm ${
        type === 'specific' 
          ? 'bg-white text-indigo-700 border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600' 
          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900'
      } ${text.includes('revenue') ? 'border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-600 hover:border-amber-600' : ''}`}
    >
      <div className={`p-1 rounded-md transition-colors ${type === 'specific' ? 'bg-indigo-50 group-hover:bg-indigo-500' : 'bg-slate-100 group-hover:bg-slate-700'} ${text.includes('revenue') ? 'bg-amber-100 group-hover:bg-amber-400' : ''}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-3 h-3 ${type === 'specific' ? 'text-indigo-600 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-200'}`}>
          <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
        </svg>
      </div>
      {text}
    </button>
  );

  return (
    <div className="flex flex-col flex-1 h-full bg-white relative">
      <div className="px-6 lg:px-10 py-5 border-b border-slate-100 flex items-center gap-4 bg-white/95 backdrop-blur-xl z-20">
        <div className="relative group">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-900 tracking-tight">Copilot <span className="text-indigo-600">Engine</span></h2>
          <div className="flex items-center gap-1 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Growth Expert 3.0</p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 lg:px-10 py-8 space-y-10 scroll-smooth">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            <div className={`max-w-[90%] md:max-w-[85%] ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none px-5 py-4 shadow-lg' 
                : 'bg-slate-50 text-slate-800 rounded-2xl rounded-tl-none px-7 py-7 border border-slate-100 shadow-sm'
            }`}>
              <div className={`text-[14px] sm:text-[15px] whitespace-pre-wrap leading-relaxed font-bold ${msg.role === 'user' ? 'text-white' : 'text-slate-700'}`}>
                {msg.text}
                {isTyping && idx === 0 && <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-500 animate-pulse align-middle"></span>}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && !isTyping && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="bg-slate-50 px-6 py-4 rounded-2xl rounded-tl-none border border-slate-100 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-duration:800ms]"></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-duration:800ms] [animation-delay:200ms]"></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-duration:800ms] [animation-delay:400ms]"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tailoring Analysis</span>
                {processStatus && <span className="text-[8px] text-indigo-500 font-bold animate-pulse">{processStatus}</span>}
              </div>
            </div>
          </div>
        )}

        {!isLoading && !isTyping && (suggestions.specific.length > 0 || suggestions.general.length > 0) && (
          <div className="flex flex-col gap-8 mt-10 pb-12">
            {suggestions.specific.length > 0 && (
              <div className="space-y-3">
                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest px-1">Priority Actions</p>
                <div className="flex flex-wrap gap-2.5">
                  {suggestions.specific.map((q, i) => <QuestionChip key={i} text={q} type="specific" />)}
                </div>
              </div>
            )}
            
            {suggestions.general.length > 0 && (
              <div className="space-y-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Deep Analysis</p>
                <div className="flex flex-wrap gap-2.5">
                  {suggestions.general.map((q, i) => <QuestionChip key={i} text={q} type="general" />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-6 lg:p-10 border-t border-slate-100 bg-white">
        <div className="relative max-w-5xl mx-auto group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading || isTyping}
            placeholder="Ask about revenue strategy or technical performance..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-8 pr-16 py-5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || isTyping || !input.trim()}
            className="absolute right-3 top-3 bottom-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white w-12 rounded-xl transition-all flex items-center justify-center active:scale-90 shadow-md shadow-indigo-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
