import { TherapyStatus } from './types';

export const safeArray = <T>(arr: T[] | undefined | null): T[] => {
  return Array.isArray(arr) ? arr : [];
};

export const normalizeStatus = (status?: string): TherapyStatus => {
  if (!status) return 'Agendada';
  const s = status.trim().toLowerCase();
  
  if (['feito', 'concluído', 'concluída', 'realizado', 'realizada', 'presente'].includes(s)) return 'Realizada';
  if (['faltou', 'falta', 'ausente'].includes(s)) return 'Falta';
  if (['cancelado', 'cancelada'].includes(s)) return 'Cancelada';
  if (['remarcado', 'remarcada'].includes(s)) return 'Remarcada';
  if (['agendada', 'agendado'].includes(s)) return 'Agendada';
  
  return 'Agendada';
};

export const getVisualIcon = (name: string) => {
  if (!name) return '⭐';
  const map: Record<string, string> = {
    'Sun': '☀️', 'Bath': '🚿', 'Utensils': '🍽️', 'Backpack': '🎒', 
    'Puzzle': '🧩', 'Moon': '🌙', 'Bed': '🛏️', 'School': '🏫', 
    'Toothbrush': '🪥', 'Shower': '🚿', 'Medication': '💊', 
    'Therapy': '🧩', 'Food': '🍽️', 'Home': '🏠', 'Car': '🚗', 
    'Book': '📚', 'Play': '🎮'
  };
  return map[name] || (name.length <= 5 ? name : '⭐');
};

export const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(event.target?.result as string);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(file.type || 'image/jpeg', quality));
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
};

export const printSection = (sectionId: string, title: string) => {
  const element = document.getElementById(sectionId);
  if (!element) {
    alert('Área de impressão não encontrada.');
    return;
  }

  const clonedElement = element.cloneNode(true) as HTMLElement;
  clonedElement.classList.remove('hidden', 'print:block');
  if (clonedElement.style.display === 'none') {
    clonedElement.style.display = 'block';
  }
  
  const printContent = clonedElement.outerHTML;
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Se a janela de impressão não abrir, use o menu do navegador para compartilhar ou salvar como PDF.');
    window.print();
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page {
            size: A4;
            margin: 12mm;
          }
          body {
            font-family: Arial, sans-serif;
            background: white;
            color: black;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .print-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          img {
            max-width: 100%;
            height: auto;
          }
          ::-webkit-scrollbar {
            display: none;
          }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
    </html>
  `);
  
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
  styles.forEach((style) => {
    printWindow.document.head.appendChild(style.cloneNode(true));
  });

  printWindow.document.close();
  printWindow.focus();
  
  alert('A janela de impressão foi aberta. Escolha Salvar como PDF, se desejar.');
  
  setTimeout(() => {
    printWindow.print();
  }, 800);
};
