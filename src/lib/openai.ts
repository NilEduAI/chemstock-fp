import { supabase } from './supabase';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker de PDF.js usando CDN para evitar problemas de bundler en Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  // Leer hasta un máximo de 10 páginas
  const maxPages = Math.min(pdf.numPages, 10);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += textContent.items.map((s: any) => s.str).join(' ') + '\n';
  }
  return fullText;
}

export const extractProductData = async (file: File) => {
  return new Promise(async (resolve, reject) => {
    // Si es un PDF, extraemos el texto nativamente en el navegador antes de enviarlo
    if (file.type === 'application/pdf') {
      try {
        const text = await extractTextFromPdf(file);
        
        const { data, error } = await supabase.functions.invoke('dynamic-endpoint', {
          body: { text }
        });
        
        if (error) throw error;
        resolve(typeof data === 'string' ? JSON.parse(data) : data);
      } catch (e) {
        reject(e);
      }
      return;
    }

    const reader = new FileReader();
    
    // Si es una imagen, la redimensionamos para que no sature el límite de subida
    if (file.type.startsWith('image/')) {
      const MAX_WIDTH = 1000;
      
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.drawImage(img, 0, 0, width, height);
          
          const base64Data = canvas.toDataURL('image/jpeg', 0.6);
          
          const { data, error } = await supabase.functions.invoke('dynamic-endpoint', {
            body: { fileData: base64Data, fileType: 'image/jpeg' }
          });
          
          if (error) throw error;
          resolve(typeof data === 'string' ? JSON.parse(data) : data);
        } catch (e) {
          reject(e);
        }
      };
      
      const objUrl = URL.createObjectURL(file);
      img.src = objUrl;
    } 
    // Para otros archivos intentamos mandar el texto
    else {
      reader.onload = async () => {
        try {
          const text = reader.result as string;
          
          const { data, error } = await supabase.functions.invoke('dynamic-endpoint', {
            body: { text }
          });
          
          if (error) throw error;
          resolve(typeof data === 'string' ? JSON.parse(data) : data);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    }
  });
};

