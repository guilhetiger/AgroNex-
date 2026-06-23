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

// Intentar arrancar Next.js capturando errores de red o del framework
try {
  const port = process.env.PORT || 3000;
  console.log(`📡 Levantando Next.js en el puerto ${port} bajo HOST 0.0.0.0...`);
  
  // Usamos next start directo para evitar intermediarios de npm run start
  execSync(`npx next start -p ${port} -H 0.0.0.0`, { stdio: 'inherit' });
} catch (execErr) {
  console.error('❌ CRASH CRÍTICO en el proceso de Next.js:', execErr.message);
  process.exit(1);
}
