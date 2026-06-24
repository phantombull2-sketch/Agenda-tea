import React, { useState } from 'react';
import { Card, Button } from './ui';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export function FeedbackModal({ isOpen, title, message, type = 'info', onConfirm, onCancel, confirmText = 'OK', cancelText }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mt-2">
          {type === 'success' && <CheckCircle2 className="w-8 h-8 text-[#A3B18A]" />}
          {type === 'error' && <AlertTriangle className="w-8 h-8 text-red-500" />}
          {type === 'info' && <Info className="w-8 h-8 text-blue-500" />}
        </div>
        <div className="flex flex-col gap-1 w-full text-center">
          <h3 className="text-lg font-bold text-stone-800 whitespace-pre-wrap">{title}</h3>
          <p className="text-sm text-stone-500 whitespace-pre-wrap">{message}</p>
        </div>
        <div className="flex w-full gap-3 mt-4">
          {cancelText && onCancel && (
            <Button variant="outline" className="flex-1" onClick={onCancel}>{cancelText}</Button>
          )}
          <Button variant="primary" className="flex-1" onClick={onConfirm}>{confirmText || 'OK'}</Button>
        </div>
      </Card>
    </div>
  );
}

export function useFeedback() {
  const [modalState, setModalState] = useState<any>(null);

  const showModal = (type: string, title: string, message: string, onConfirm?: () => void, cancelText?: string, onCancel?: () => void, confirmText?: string) => {
    setModalState({ isOpen: true, type, title, message, onConfirm, cancelText, onCancel, confirmText });
  };

  const showSuccess = (title: string, message: string, onConfirm?: () => void) => showModal('success', title, message, onConfirm);
  const showError = (title: string, message: string, onConfirm?: () => void) => showModal('error', title, message, onConfirm);
  const confirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void, confirmText = 'Confirmar', cancelText = 'Cancelar') => 
    showModal('info', title, message, onConfirm, cancelText, onCancel, confirmText);

  const close = () => setModalState(null);

  const FeedbackComponent = () => modalState ? (
    <FeedbackModal 
      {...modalState} 
      onConfirm={() => {
        if (modalState.onConfirm) modalState.onConfirm();
        close();
      }}
      onCancel={modalState.cancelText ? () => {
        if (modalState.onCancel) modalState.onCancel();
        close();
      } : undefined}
    />
  ) : null;

  return { showSuccess, showError, confirm, close, FeedbackComponent };
}
