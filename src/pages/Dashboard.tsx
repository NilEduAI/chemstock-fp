import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FlaskConical, Microscope, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState({
    chemicals: 0,
    equipment: 0,
    lowStock: 0,
  });

  useEffect(() => {
    fetchStats();

    const chemicalsSub = supabase
      .channel('dashboard_chemicals')
      .on('postgres_changes' as any, { event: '*', table: 'chemicals' }, () => fetchStats())
      .subscribe();

    const equipmentSub = supabase
      .channel('dashboard_equipment')
      .on('postgres_changes' as any, { event: '*', table: 'equipment' }, () => fetchStats())
      .subscribe();

    return () => {
      supabase.removeChannel(chemicalsSub);
      supabase.removeChannel(equipmentSub);
    };
  }, []);

  const fetchStats = async () => {
    const { data: chemicals } = await supabase.from('chemicals').select('*');
    const { data: equipment } = await supabase.from('equipment').select('*');

    const lowStockCount = chemicals?.filter(c => c.quantity <= c.min_quantity).length || 0;

    setStats({
      chemicals: chemicals?.length || 0,
      equipment: equipment?.length || 0,
      lowStock: lowStockCount,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Productos Químicos
            </CardTitle>
            <FlaskConical className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.chemicals}</div>
            <p className="text-xs text-slate-500">
              Registrados en el inventario
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Equipos
            </CardTitle>
            <Microscope className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.equipment}</div>
            <p className="text-xs text-slate-500">
              Equipos de laboratorio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Stock Bajo
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.lowStock}</div>
            <p className="text-xs text-slate-500">
              Productos por debajo del mínimo
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
