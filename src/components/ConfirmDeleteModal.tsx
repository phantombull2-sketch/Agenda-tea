import React, { useState } from 'react';
import { Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  itemName: string;
}

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, itemName }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setError('');
      setIsDeleting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertCircle className="w-6 h-6" />
          <h2 className="text-lg font-bold">{title}</h2>
        </div>
        <p className="text-gray-600 mb-6 text-sm">
          Tem certeza que deseja excluir <strong>{itemName}</strong>? Esta ação não pode ser desfeita.
        </p>
        
        {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
        
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isDeleting} className="px-4">Cancelar</Button>
          <Button onClick={handleConfirm} disabled={isDeleting} className="px-4 bg-red-600 hover:bg-red-700 text-white border-0">
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Excluir
          </Button>
        </div>
      </div>
    </div>
  );
}
