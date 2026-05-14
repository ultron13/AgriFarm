import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Lock, CreditCard, ArrowLeft, Loader2 } from 'lucide-react';
import { useMockCompletePayment } from '@/hooks/usePayments';

export function MockOzowPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const orderId = params.get('orderId') ?? '';
  const amount = parseFloat(params.get('amount') ?? '0');
  const ref = params.get('ref') ?? '';

  const [step, setStep] = useState<'bank' | 'otp' | 'done'>('bank');
  const [bank, setBank] = useState('FNB');
  const [otp, setOtp] = useState('');
  const complete = useMockCompletePayment();

  const handlePayNow = () => {
    setStep('otp');
  };

  const handleConfirmOtp = async () => {
    await complete.mutateAsync(orderId);
    setStep('done');
  };

  useEffect(() => {
    if (step === 'done') {
      const t = setTimeout(() => navigate('/orders?payment=success'), 2500);
      return () => clearTimeout(t);
    }
  }, [step, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Ozow header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-[#00b0b9] px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-lg tracking-tight">ozow</p>
              <p className="text-[#b3e8eb] text-xs">Instant EFT · Demo mode</p>
            </div>
            <div className="flex items-center gap-1.5 text-[#b3e8eb] text-xs">
              <Lock size={11} />
              Secured
            </div>
          </div>

          <div className="px-6 py-5">
            {step === 'bank' && (
              <>
                <div className="mb-5 p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-0.5">Payment to</p>
                  <p className="font-semibold text-gray-900 text-sm">FarmConnect SA (Pty) Ltd</p>
                  <p className="text-xs text-gray-500 mt-2 mb-0.5">Reference</p>
                  <p className="font-mono text-xs text-gray-700">{ref || orderId}</p>
                  <p className="text-xs text-gray-500 mt-2 mb-0.5">Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R{amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 block mb-2">Select your bank</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['FNB', 'Nedbank', 'ABSA', 'Standard', 'Capitec', 'TymeBank'].map((b) => (
                      <button
                        key={b}
                        onClick={() => setBank(b)}
                        className={`py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                          bank === b
                            ? 'border-[#00b0b9] bg-[#e6f9fa] text-[#00848b]'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handlePayNow}
                  className="w-full bg-[#00b0b9] hover:bg-[#00848b] text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard size={16} />
                  Pay R{amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} via {bank}
                </button>
              </>
            )}

            {step === 'otp' && (
              <>
                <div className="text-center mb-5">
                  <div className="w-12 h-12 bg-[#e6f9fa] rounded-full flex items-center justify-center mx-auto mb-3">
                    <Lock size={20} className="text-[#00848b]" />
                  </div>
                  <p className="font-semibold text-gray-900">OTP Verification</p>
                  <p className="text-xs text-gray-500 mt-1">A one-time PIN was sent to your registered number</p>
                  <p className="text-xs text-[#00848b] font-medium mt-0.5">(Demo: use any 4–6 digit code)</p>
                </div>

                <div className="mb-4">
                  <input
                    type="number"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                    placeholder="Enter OTP"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-[#00b0b9]"
                    autoFocus
                  />
                </div>

                <button
                  onClick={handleConfirmOtp}
                  disabled={otp.length < 4 || complete.isPending}
                  className="w-full bg-[#00b0b9] hover:bg-[#00848b] disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {complete.isPending ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                  Confirm Payment
                </button>

                <button onClick={() => setStep('bank')} className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600">
                  <ArrowLeft size={11} /> Back
                </button>
              </>
            )}

            {step === 'done' && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-600" />
                </div>
                <p className="font-bold text-gray-900 text-lg">Payment successful!</p>
                <p className="text-sm text-gray-500 mt-1">
                  R{amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} paid to FarmConnect SA
                </p>
                <p className="text-xs text-gray-400 mt-3">Redirecting you back…</p>
              </div>
            )}
          </div>

          <div className="px-6 pb-4 flex items-center justify-center gap-1.5 text-[10px] text-gray-300">
            <Lock size={9} />
            256-bit SSL · PCI-DSS compliant · Demo mode — no real payment processed
          </div>
        </div>
      </div>
    </div>
  );
}
