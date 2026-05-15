#!/usr/bin/env pwsh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AgroNex - Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if EAS CLI is installed
$eas = Get-Command eas -ErrorAction SilentlyContinue
if (-not $eas) {
  Write-Host "❌ EAS CLI no está instalado. Instalando..." -ForegroundColor Red
  npm install -g eas-cli
}

# Check login status
Write-Host "Verificando estado de login..." -ForegroundColor Yellow
$loginStatus = eas whoami 2>&1
if ($loginStatus -like "*Not logged in*") {
  Write-Host "❌ No autenticado. Ejecutando login..." -ForegroundColor Red
  eas login
} else {
  Write-Host "✅ Ya estás autenticado como: $loginStatus" -ForegroundColor Green
}

Write-Host ""
Write-Host "Selecciona qué generar:" -ForegroundColor Cyan
Write-Host "1. APK Android (QR para descargar)" 
Write-Host "2. TestFlight iOS (solo macOS)"
Write-Host "3. Ambos (solo si estás en macOS)"
Write-Host ""

$selection = Read-Host "Opción (1-3)"

switch ($selection) {
  "1" {
    Write-Host ""
    Write-Host "Generando APK Android..." -ForegroundColor Yellow
    eas build --platform android --profile preview
  }
  "2" {
    Write-Host ""
    Write-Host "Generando build iOS..." -ForegroundColor Yellow
    eas build --platform ios --profile preview
  }
  "3" {
    Write-Host ""
    Write-Host "Generando ambos builds..." -ForegroundColor Yellow
    eas build --platform android --profile preview
    eas build --platform ios --profile preview
  }
  default {
    Write-Host "Opción inválida" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "✅ Build completado. Revisa el QR en https://expo.dev/builds" -ForegroundColor Green
