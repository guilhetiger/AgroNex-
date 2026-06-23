const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Iniciando script de arranque start-railway.js...');
console.log('⚙️ Entorno detectado - PORT:', process.env.PORT, 'NODE_ENV:', process.env.NODE_ENV);

try {
  if (process.env.GCP_SA_JSON) {
    console.log('📦 Detectada variable GCP_SA_JSON (Tamaño:', process.env.GCP_SA_JSON.length, 'caracteres)');
    fs.writeFileSync('/tmp/gcp-sa.json', process.env.GCP_SA_JSON);
    console.log('✅ Archivo /tmp/gcp-sa.json escrito correctamente.');
    
    // Inyectar la variable en el entorno global del proceso nativo
    process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/gcp-sa.json';
    console.log('🔗 GOOGLE_APPLICATION_CREDENTIALS configurada en el entorno.');
  } else {
    console.error('❌ ERROR CRÍTICO: GCP_SA_JSON no existe en las variables de entorno de Railway.');
  }
} catch (err) {
  console.error('❌ Error fatal escribiendo las credenciales de GCP:', err.message);
}

// Forzar la lectura estricta y dinámica del PORT asignado por Railway
const assignedPort = process.env.PORT || '3000';

console.log(`📡 Mapeando Next.js estrictamente en el puerto de producción: ${assignedPort}`);

try {
  // Ejecutar Next.js forzando el puerto asignado y el host global 0.0.0.0
  execSync(`npx next start -p ${assignedPort} -H 0.0.0.0`, { stdio: 'inherit' });
} catch (execErr) {
  console.error('❌ CRASH CRÍTICO al levantar Next.js:', execErr.message);
  process.exit(1);
}
