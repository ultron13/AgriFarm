import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import {
  MessageCircle, Send, RotateCcw, CheckCheck, Clock,
  Wifi, Battery, User, PackageCheck, AlertCircle,
} from 'lucide-react';
import { useSimulateWhatsApp, useActiveSessions } from '@/hooks/useWhatsApp';
import { useAuth } from '@/hooks/useAuth';

const DEMO_NUMBERS = [
  { label: 'Forti Sandton (demo buyer)', phone: '+27721234567' },
  { label: 'Unknown number', phone: '+27600000001' },
];

interface Message {
  from: 'user' | 'bot';
  text: string;
  at: Date;
  orderNumber?: string;
}

function extractOrderNumber(text: string): string | undefined {
  const m = text.match(/Reference:\s*\*?(FC-\d{4}-\d+)\*?/);
  return m?.[1];
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
}

function BubbleText({ text }: { text: string }) {
  // Render **bold** and *bold* markdown simply
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <span>
      {parts.map((p, i) =>
        p.startsWith('*') && p.endsWith('*')
          ? <strong key={i}>{p.slice(1, -1)}</strong>
          : <span key={i}>{p}</span>
      )}
    </span>
  );
}

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.from === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-1.5`}>
      <div className={`max-w-[78%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-[#dcf8c6] text-gray-900 rounded-br-sm'
            : 'bg-white text-gray-900 rounded-bl-sm shadow-sm border border-gray-100'
        }`}>
          <BubbleText text={msg.text} />
          <div className={`flex items-center gap-1 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[10px] text-gray-400">{formatTime(msg.at)}</span>
            {isUser && <CheckCheck size={12} className="text-[#53bdeb]" />}
          </div>
        </div>
        {msg.orderNumber && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-100 rounded-full px-2.5 py-0.5">
            <PackageCheck size={11} />
            Order {msg.orderNumber} placed
          </div>
        )}
      </div>
    </div>
  );
}

function PhoneFrame({ phone, messages, input, onInput, onSend, loading, onReset }: {
  phone: string;
  messages: Message[];
  input: string;
  onInput: (v: string) => void;
  onSend: () => void;
  loading: boolean;
  onReset: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
  };

  return (
    <div className="w-[360px] shrink-0">
      {/* Phone chrome */}
      <div className="bg-gray-800 rounded-[2.5rem] p-3 shadow-2xl">
        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-1 text-white text-xs mb-1">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <Wifi size={11} />
            <Battery size={11} />
          </div>
        </div>

        <div className="bg-[#ece5dd] rounded-[2rem] overflow-hidden">
          {/* WhatsApp header */}
          <div className="bg-[#075e54] px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#128c7e] flex items-center justify-center shrink-0">
              <MessageCircle size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold leading-tight">FarmConnect SA</p>
              <p className="text-[#9de1d6] text-[11px]">online</p>
            </div>
            <button onClick={onReset} className="text-[#9de1d6] hover:text-white transition-colors" title="New session">
              <RotateCcw size={15} />
            </button>
          </div>

          {/* Messages */}
          <div className="h-[440px] overflow-y-auto px-3 py-3 space-y-0.5 bg-[#ece5dd]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3C/svg%3E\")" }}>
            {messages.length === 0 && (
              <div className="text-center pt-16 text-gray-400">
                <MessageCircle size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-xs">Send a message to start the ordering flow</p>
                <p className="text-xs mt-1 opacity-70">Try typing <strong>HI</strong></p>
              </div>
            )}
            {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
            {loading && (
              <div className="flex justify-start mb-1.5">
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm border border-gray-100">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="bg-[#f0f0f0] px-2 py-2 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => onInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message"
              className="flex-1 bg-white rounded-full px-4 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400"
            />
            <button
              onClick={onSend}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-full bg-[#075e54] flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-[#064c44] transition-colors"
            >
              <Send size={16} className="text-white translate-x-0.5" />
            </button>
          </div>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center mt-2">
          <div className="w-24 h-1 bg-gray-600 rounded-full" />
        </div>
      </div>

      {/* Phone label */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-400 font-mono">{phone}</p>
      </div>
    </div>
  );
}

export function WhatsAppSimulatorPage() {
  const { user } = useAuth();
  const [phoneIdx, setPhoneIdx] = useState(0);
  const [customPhone, setCustomPhone] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const simulate = useSimulateWhatsApp();
  const { data: sessionsData } = useActiveSessions();
  const activeSessions = sessionsData?.data ?? [];

  const phone = showCustom ? customPhone : DEMO_NUMBERS[phoneIdx]?.phone ?? '';

  const handleSend = () => {
    const text = input.trim();
    if (!text || !phone) return;
    setInput('');

    const userMsg: Message = { from: 'user', text, at: new Date() };
    setMessages((prev) => [...prev, userMsg]);

    simulate.mutate({ phone, message: text }, {
      onSuccess: (res) => {
        if (!res.data) return;
        const reply = res.data.reply;
        const orderNumber = extractOrderNumber(reply);
        setMessages((prev) => [...prev, { from: 'bot', text: reply, at: new Date(), orderNumber }]);
      },
      onError: () => {
        setMessages((prev) => [...prev, { from: 'bot', text: 'Error — could not reach the server. Please try again.', at: new Date() }]);
      },
    });
  };

  const handleReset = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Simulator</h1>
          <span className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">dev / demo</span>
        </div>
        <p className="text-gray-500 text-sm">Test the WhatsApp ordering flow end-to-end. Orders placed here are real records.</p>
      </div>

      <div className="flex gap-8 items-start">
        {/* Phone simulator */}
        <div className="shrink-0">
          {/* Number selector */}
          <div className="mb-5 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-medium">Simulate as:</span>
            {DEMO_NUMBERS.map((n, i) => (
              <button
                key={n.phone}
                onClick={() => { setPhoneIdx(i); setShowCustom(false); }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  !showCustom && phoneIdx === i
                    ? 'border-brand-400 bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {n.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustom(true)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                showCustom ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              Custom number
            </button>
            {showCustom && (
              <input
                type="tel"
                placeholder="+27821234567"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 w-36 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            )}
          </div>

          <PhoneFrame
            phone={phone}
            messages={messages}
            input={input}
            onInput={setInput}
            onSend={handleSend}
            loading={simulate.isPending}
            onReset={handleReset}
          />
        </div>

        {/* Side panel */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* How it works */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-900 mb-3">How the flow works</p>
            <ol className="space-y-2 text-sm text-gray-600">
              {[
                ['HI or any text', 'Bot greets the buyer by name (looks up phone number)'],
                ['Reply 1', 'Browse today\'s active listings'],
                ['Reply a number', 'Select a listing'],
                ['Enter quantity', 'How many kg (validated against minimum + stock)'],
                ['Choose delivery date', '3 upcoming weekdays shown'],
                ['Reply YES', 'Order placed — real record created with source=WHATSAPP'],
                ['ORDERS', 'Check recent orders anytime'],
                ['CANCEL / HELP', 'Navigation commands, work from any state'],
              ].map(([cmd, desc], i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <div>
                    <span className="font-mono text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded mr-1.5">{cmd}</span>
                    <span className="text-xs text-gray-500">{desc}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Active sessions (admin only) */}
          {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-900">Active sessions</p>
                <span className="text-xs text-gray-400">auto-refreshes every 15s</span>
              </div>
              {activeSessions.length === 0 ? (
                <p className="text-sm text-gray-400">No active conversations</p>
              ) : (
                <div className="space-y-2">
                  {activeSessions.map((s) => (
                    <div key={s.phone} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-[#dcf8c6] flex items-center justify-center shrink-0">
                        <User size={14} className="text-[#075e54]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{s.buyerName ?? s.phone}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <span className="font-mono">{s.phone}</span>
                          <span>·</span>
                          <span className="text-brand-600 font-medium">{s.state}</span>
                          <span>·</span>
                          <span>{s.messages} msgs</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={10} />
                        {new Date(s.lastAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tips */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <div className="flex gap-2.5">
              <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-amber-700">
                <p className="font-semibold">Simulator notes</p>
                <p>Orders placed here create real database records (source: WHATSAPP). You can view them in the Orders page.</p>
                <p>Sessions expire after 30 minutes of inactivity. Use the <strong>↺</strong> button in the chat header to start a fresh session.</p>
                <p>In production, the real Clickatell webhook at <code className="bg-amber-100 px-1 rounded">/api/v1/webhooks/whatsapp</code> handles actual buyer messages.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
