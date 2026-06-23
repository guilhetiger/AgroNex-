const fs = require('fs');
try {
  if (process.env.GCP_SA_JSON) {
    fs.writeFileSync('/tmp/gcp-sa.json', process.env.GCP_SA_JSON);
    console.log('✅ Google Cloud Service Account escrita con éxito en /tmp/gcp-sa.json');
    // Inyectar de manera segura la variable para Vertex AI en el entorno global del proceso
    process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/gcp-sa.json';
  } else {
    console.error('⚠️ Advertencia: GCP_SA_JSON no está definida.');
  }
} catch (err) {
  console.error('❌ Error escribiendo las credenciales de GCP:', err);
}

// Iniciar Next.js en el puerto de Railway bajo el HOST 0.0.0.0 para evitar el connection refused
const { execSync } = require('child_process');
const port = process.env.PORT || 3000;
execSync(`npx next start -p ${port} -H 0.0.0.0`, { stdio: 'inherit' });
