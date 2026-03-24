import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://tyvuabcjrrbvfzhsubia.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "sb_secret_c7y5c6F04DQHoigbKof-EA_9tL4wz3a";

// Usamos el cliente de Supabase con la clave secreta (Service Role) para evitar RLS
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUsers() {
  console.log('⚙️ Creando cuenta de Profesor...');
  const { data: profeData, error: profeError } = await supabaseAdmin.auth.admin.createUser({
    email: 'profe@chemstock.edu',
    password: 'profe123',
    email_confirm: true,
    user_metadata: { full_name: 'Profesor Test' }
  });

  if (profeError) {
    if (profeError.message.includes('already been registered')) {
        console.log('✅ El Profesor ya existía en la base de datos.');
    } else {
        console.error('❌ Error creando Profesor:', profeError.message);
    }
  } else {
    console.log('✅ Profesor creado:', profeData.user.id);
    // Actualizamos el rol del perfil a "profe" explícitamente usando la clave secreta
    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'profe' })
        .eq('id', profeData.user.id);
    
    if (updateError) console.error('❌ Error asignando rol de Profe:', updateError.message);
    else console.log('✅ Perfil de Profesor actualizado correctamente.');
  }

  console.log('\n⚙️ Creando cuenta de Alumno...');
  const { data: alumnoData, error: alumnoError } = await supabaseAdmin.auth.admin.createUser({
    email: 'alumno@chemstock.edu',
    password: 'alumno123',
    email_confirm: true,
    user_metadata: { full_name: 'Alumno Test' }
  });

  if (alumnoError) {
     if (alumnoError.message.includes('already been registered')) {
        console.log('✅ El Alumno ya existía en la base de datos.');
    } else {
        console.error('❌ Error creando Alumno:', alumnoError.message);
    }
  } else {
    console.log('✅ Alumno creado:', alumnoData.user.id);
    // El trigger de supabase_complete_schema.sql debería añadir el perfil automáticamente 
    // y asignarle rol 'alumno', pero lo forzamos por seguridad:
    await supabaseAdmin
        .from('profiles')
        .update({ role: 'alumno' })
        .eq('id', alumnoData.user.id);
  }

  console.log('\n🚀 Proceso completado.');
}

createUsers();
