import React, { createContext, useContext } from "react";
import { Vehicle } from "@/types/models";

const VehicleContext = createContext<Vehicle | null>(null);

export function VehicleProvider({ vehicle, children }: { vehicle: Vehicle; children: React.ReactNode }) {
  return <VehicleContext.Provider value={vehicle}>{children}</VehicleContext.Provider>;
}

export function useVehicle(): Vehicle {
  const v = useContext(VehicleContext);
  if (!v) throw new Error("useVehicle must be used within VehicleProvider");
  return v;
}
