import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Equipment {
  id: string;
  name: string;
  brand: string;
  model: string;
  serial_number: string;
  status: string;
  location: string;
}

export default function Equipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '', brand: '', model: '', serial_number: '', status: 'Operativo', location: ''
  });

  useEffect(() => {
    fetchEquipment();

    const subscription = supabase
      .channel('equipment_changes')
      .on('postgres_changes' as any, { event: '*', table: 'equipment' }, () => {
        fetchEquipment();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchEquipment = async () => {
    const { data, error } = await supabase.from('equipment').select('*').order('name');
    if (error) {
      console.error('Error fetching equipment:', error);
    } else {
      setEquipment(data || []);
    }
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('equipment').insert([formData]);
      if (error) throw error;
      toast.success('Equipo añadido correctamente');
      setIsAdding(false);
      setFormData({ name: '', brand: '', model: '', serial_number: '', status: 'Operativo', location: '' });
    } catch (error) {
      toast.error('Error al añadir el equipo');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este equipo?')) {
      try {
        const { error } = await supabase.from('equipment').delete().eq('id', id);
        if (error) throw error;
        toast.success('Equipo eliminado');
      } catch (error) {
        toast.error('Error al eliminar');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Equipos de Laboratorio</h1>
        <Button onClick={() => setIsAdding(!isAdding)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Equipo
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Añadir Nuevo Equipo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Marca</label>
                <Input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Modelo</label>
                <Input value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nº Serie</label>
                <Input value={formData.serial_number} onChange={e => setFormData({...formData, serial_number: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <select 
                   className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                   value={formData.status} 
                   onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Operativo">Operativo</option>
                  <option value="En Mantenimiento">En Mantenimiento</option>
                  <option value="Averiado">Averiado</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ubicación</label>
                <Input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
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
              <TableHead>Marca/Modelo</TableHead>
              <TableHead>Nº Serie</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipment.map((eq) => (
              <TableRow key={eq.id}>
                <TableCell className="font-medium">{eq.name}</TableCell>
                <TableCell>{eq.brand} {eq.model}</TableCell>
                <TableCell>{eq.serial_number}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    eq.status === 'Operativo' ? 'bg-green-100 text-green-800' :
                    eq.status === 'Averiado' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {eq.status}
                  </span>
                </TableCell>
                <TableCell>{eq.location}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(eq.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {equipment.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  No hay equipos registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
