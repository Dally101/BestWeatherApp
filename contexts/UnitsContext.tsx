import React, { createContext, useContext, useState, ReactNode } from 'react';

export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type SpeedUnit = 'kmh' | 'mph';
export type PressureUnit = 'hpa' | 'inHg';
export type DistanceUnit = 'km' | 'miles';

interface UnitsContextType {
  temperatureUnit: TemperatureUnit;
  speedUnit: SpeedUnit;
  pressureUnit: PressureUnit;
  distanceUnit: DistanceUnit;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  setSpeedUnit: (unit: SpeedUnit) => void;
  setPressureUnit: (unit: PressureUnit) => void;
  setDistanceUnit: (unit: DistanceUnit) => void;
  toggleTemperatureUnit: () => void;
  toggleSpeedUnit: () => void;
  togglePressureUnit: () => void;
  toggleDistanceUnit: () => void;
}

const UnitsContext = createContext<UnitsContextType | undefined>(undefined);

interface UnitsProviderProps {
  children: ReactNode;
}

export function UnitsProvider({ children }: UnitsProviderProps) {
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>('celsius');
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>('kmh');
  const [pressureUnit, setPressureUnit] = useState<PressureUnit>('hpa');
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>('km');

  const toggleTemperatureUnit = () => {
    setTemperatureUnit(prev => prev === 'celsius' ? 'fahrenheit' : 'celsius');
  };

  const toggleSpeedUnit = () => {
    setSpeedUnit(prev => prev === 'kmh' ? 'mph' : 'kmh');
  };

  const togglePressureUnit = () => {
    setPressureUnit(prev => prev === 'hpa' ? 'inHg' : 'hpa');
  };

  const toggleDistanceUnit = () => {
    setDistanceUnit(prev => prev === 'km' ? 'miles' : 'km');
  };

  return (
    <UnitsContext.Provider
      value={{
        temperatureUnit,
        speedUnit,
        pressureUnit,
        distanceUnit,
        setTemperatureUnit,
        setSpeedUnit,
        setPressureUnit,
        setDistanceUnit,
        toggleTemperatureUnit,
        toggleSpeedUnit,
        togglePressureUnit,
        toggleDistanceUnit,
      }}
    >
      {children}
    </UnitsContext.Provider>
  );
}

export function useUnits() {
  const context = useContext(UnitsContext);
  if (context === undefined) {
    throw new Error('useUnits must be used within a UnitsProvider');
  }
  return context;
} 