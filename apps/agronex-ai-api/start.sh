#!/bin/sh
echo "SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6dnNtbHNjc2VlbXhzcmJ5a3dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNjE2MjQsImV4cCI6MjA5NTkzNzYyNH0.guxc3UwynVWPtjghsHKZojD7LCjYfHMuI28yYDtTUnA" > .env.production
# Reemplaza el JSON de abajo con el service account minificado en una sola linea:
echo 'GCP_SA_JSON={"type":"service_account","project_id":"agronex-498111","private_key_id":"REPLACE_ME","private_key":"-----BEGIN PRIVATE KEY-----\nREPLACE\n-----END PRIVATE KEY-----\n","client_email":"REPLACE@agronex-498111.iam.gserviceaccount.com","client_id":"REPLACE","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/REPLACE","universe_domain":"googleapis.com"}' >> .env.production
npx next start -p ${PORT:-3000} -H 0.0.0.0
