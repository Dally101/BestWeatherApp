import { TemperatureUnit, SpeedUnit, PressureUnit, DistanceUnit } from '@/contexts/UnitsContext';

// Temperature conversions
export function convertTemperature(celsius: number, unit: TemperatureUnit): number {
  if (unit === 'fahrenheit') {
    return (celsius * 9/5) + 32;
  }
  return celsius;
}

export function getTemperatureSymbol(unit: TemperatureUnit): string {
  return unit === 'celsius' ? '°C' : '°F';
}

// Speed conversions
export function convertSpeed(kmh: number, unit: SpeedUnit): number {
  if (unit === 'mph') {
    return kmh * 0.621371;
  }
  return kmh;
}

export function getSpeedUnit(unit: SpeedUnit): string {
  return unit === 'kmh' ? 'km/h' : 'mph';
}

// Pressure conversions
export function convertPressure(hpa: number, unit: PressureUnit): number {
  if (unit === 'inHg') {
    return hpa * 0.02953;
  }
  return hpa;
}

export function getPressureUnit(unit: PressureUnit): string {
  return unit === 'hpa' ? 'hPa' : 'inHg';
}

// Distance conversions
export function convertDistance(km: number, unit: DistanceUnit): number {
  if (unit === 'miles') {
    return km * 0.621371;
  }
  return km;
}

export function getDistanceUnit(unit: DistanceUnit): string {
  return unit === 'km' ? 'km' : 'mi';
}

// Formatted display functions
export function formatTemperature(celsius: number, unit: TemperatureUnit, showUnit: boolean = true): string {
  const converted = Math.round(convertTemperature(celsius, unit));
  return showUnit ? `${converted}${getTemperatureSymbol(unit)}` : `${converted}°`;
}

export function formatSpeed(kmh: number, unit: SpeedUnit): string {
  const converted = Math.round(convertSpeed(kmh, unit));
  return `${converted} ${getSpeedUnit(unit)}`;
}

export function formatPressure(hpa: number, unit: PressureUnit): string {
  const converted = unit === 'inHg' ? convertPressure(hpa, unit).toFixed(2) : Math.round(convertPressure(hpa, unit));
  return `${converted} ${getPressureUnit(unit)}`;
}

export function formatDistance(km: number, unit: DistanceUnit): string {
  const converted = Math.round(convertDistance(km, unit));
  return `${converted} ${getDistanceUnit(unit)}`;
} 