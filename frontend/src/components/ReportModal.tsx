import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, Send, ShieldAlert } from 'lucide-react';
import { reportService, ReportType } from '../services/reportService';
import { useAuth } from '../contexts/AuthContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: ReportType;
  targetName?: string;
}

const REASONS = [
  'Spam ou fraude',
  'Discurso de ódio ou assédio',
  'Conteúdo sexual inapropriado',
  'Violência ou ameaças',
  'Informações falsas',
  'Outro'
];

export default function ReportModal({ isOpen, onClose, targetId, targetType, targetName }: ReportModalProps) {
  const { currentUser } = useAuth();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !reason) return;

    setIsSubmitting(true);
    try {
      await reportService.submitReport({
        targetId,
        targetType,
        reporterId: currentUser.uid,
        reason,
        details
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setReason('');
        setDetails('');
      }, 2000);
    } catch (error) {
      console.error('Failed to submit report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-vibe-bg border border-vibe-border rounded-[32px] overflow-hidden shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2 text-vibe-neon-pink">
                <AlertTriangle className="w-5 h-5" />
                <h2 className="text-lg font-black uppercase tracking-tighter">Denunciar</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isSuccess ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                  <ShieldAlert className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">Denúncia Enviada</h3>
                <p className="text-vibe-muted text-sm">Nossa equipe de moderação irá analisar o conteúdo em breve.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-vibe-muted text-xs font-medium">
                  Você está denunciando {targetType === 'user' ? 'o usuário' : 'o post'} <span className="text-white font-bold">{targetName || 'selecionado'}</span>. Por que você está fazendo esta denúncia?
                </p>

                <div className="grid grid-cols-1 gap-2">
                  {REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={`text-left px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                        reason === r
                          ? 'bg-vibe-neon-pink/10 border-vibe-neon-pink text-white shadow-[0_0_15px_rgba(255,36,180,0.2)]'
                          : 'bg-white/5 border-white/10 text-vibe-muted hover:border-vibe-neon-pink/50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {reason && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label className="text-[10px] font-black uppercase tracking-widest text-vibe-muted ml-1">Detalhes Adicionais (Opcional)</label>
                    <textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Dê mais detalhes sobre o ocorrido..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white outline-none focus:neon-border-pink h-24 resize-none transition-all"
                    />
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={!reason || isSubmitting}
                  className="w-full py-4 bg-vibe-gradient-pink text-white font-black rounded-2xl shadow-lg flex items-center justify-center space-x-2 uppercase tracking-widest text-xs disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Denúncia</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
