import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { sendLowStockAlert } from '../lib/resend';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Chemical {
  id: string;
  name: string;
  formula: string;
  cas: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  location: string;
}

export default function Chemicals() {
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '', formula: '', cas: '', quantity: 0, unit: 'ml', min_quantity: 0, location: ''
  });

  useEffect(() => {
    fetchChemicals();

    const subscription = supabase
      .channel('chemicals_changes')
      .on('postgres_changes' as any, { event: '*', table: 'chemicals' }, () => {
        fetchChemicals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchChemicals = async () => {
    const { data, error } = await supabase.from('chemicals').select('*').order('name');
    if (error) {
      console.error('Error fetching chemicals:', error);
    } else {
      setChemicals(data || []);
    }
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('chemicals').insert([formData]);
      if (error) throw error;

      toast.success('Producto añadido correctamente');
      setIsAdding(false);
      setFormData({ name: '', formula: '', cas: '', quantity: 0, unit: 'ml', min_quantity: 0, location: '' });
      
      // Check for low stock immediately
      if (formData.quantity <= formData.min_quantity) {
        sendLowStockAlert(formData.name, 'admin@example.com'); // Placeholder recipient
      }
    } catch (error) {
      toast.error('Error al añadir el producto');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        const { error } = await supabase.from('chemicals').delete().eq('id', id);
        if (error) throw error;
        toast.success('Producto eliminado');
      } catch (error) {
        toast.error('Error al eliminar');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Productos Químicos</h1>
        <Button onClick={() => setIsAdding(!isAdding)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Añadir Nuevo Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fórmula</label>
                <Input value={formData.formula} onChange={e => setFormData({...formData, formula: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CAS</label>
                <Input value={formData.cas} onChange={e => setFormData({...formData, cas: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ubicación (Armario/Estante)</label>
                <Input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cantidad</label>
                <Input type="number" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unidad (ml, g, L, kg)</label>
                <Input required value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cantidad Mínima (Alerta)</label>
                <Input type="number" required value={formData.min_quantity} onChange={e => setFormData({...formData, min_quantity: Number(e.target.value)})} />
              </div>
              <div className="col-span-2 flex justify-end space-x-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancelar</Button>
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Fórmula</TableHead>
              <TableHead>CAS</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chemicals.map((chem) => (
              <TableRow key={chem.id}>
                <TableCell className="font-medium">{chem.name}</TableCell>
                <TableCell>{chem.formula}</TableCell>
                <TableCell>{chem.cas}</TableCell>
                <TableCell>
                  <span className={chem.quantity <= chem.min_quantity ? "text-red-600 font-bold" : ""}>
                    {chem.quantity} {chem.unit}
                  </span>
                </TableCell>
                <TableCell>{chem.location}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(chem.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {chemicals.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  No hay productos registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
