import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { UploadCloud, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { extractProductData } from '../lib/openai';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function AIExtract() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setExtractedData(null);
    }
  };

  const processFile = async () => {
    if (!file) return;
    
    try {
      setIsProcessing(true);
      // Pass the actual File object to the OpenAI service to process images or read text
      const data = await extractProductData(file) as any;
      setExtractedData(data);
      toast.success('Datos extraídos correctamente');
      
    } catch (error: any) {
      console.error('Error processing file with OpenAI:', error);
      toast.error('Error al procesar el archivo. ' + (error?.message || 'Revisa la clave de API.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToInventory = async () => {
    if (!extractedData) return;
    
    try {
      const { error } = await supabase.from('chemicals').insert([{
        name: extractedData.name || '',
        formula: extractedData.formula || '',
        cas: extractedData.cas || '',
        quantity: 0,
        unit: 'ml',
        min_quantity: 0,
        location: 'Por clasificar',
        hazards: extractedData.hazards || [],
        precautions: extractedData.precautions || [],
        manufacturer: extractedData.manufacturer || ''
      }]);

      if (error) throw error;

      toast.success('Producto guardado en el inventario');
      setExtractedData(null);
      setFile(null);
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      toast.error('Error al guardar en el inventario');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Extracción con IA</h1>
        <p className="text-slate-500 mt-2">
          Sube una Ficha de Datos de Seguridad (FDS) en PDF o imagen para extraer automáticamente los datos del producto químico.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subir Documento</CardTitle>
            <CardDescription>Formatos soportados: PDF, JPG, PNG</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors">
              <UploadCloud className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <Input 
                type="file" 
                accept="application/pdf,image/*" 
                onChange={handleFileChange}
                className="max-w-xs mx-auto"
              />
            </div>
            
            <Button 
              className="w-full" 
              onClick={processFile} 
              disabled={!file || isProcessing}
            >
              {isProcessing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
              ) : (
                <><FileText className="w-4 h-4 mr-2" /> Extraer Datos</>
              )}
            </Button>
          </CardContent>
        </Card>

        {extractedData && (
          <Card className="border-blue-200 shadow-blue-50">
            <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
              <div className="flex items-center text-blue-700">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                <CardTitle>Datos Extraídos</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase">Nombre</span>
                <p className="font-medium">{extractedData.name || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase">Fórmula</span>
                  <p>{extractedData.formula || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase">CAS</span>
                  <p>{extractedData.cas || 'N/A'}</p>
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase">Fabricante</span>
                <p>{extractedData.manufacturer || 'N/A'}</p>
              </div>
              
              {extractedData.hazards && extractedData.hazards.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase">Peligros (Frases H)</span>
                  <ul className="list-disc list-inside text-sm mt-1 text-red-600">
                    {extractedData.hazards.map((h: string, i: number) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button className="w-full mt-4" onClick={saveToInventory}>
                Guardar en Inventario
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
