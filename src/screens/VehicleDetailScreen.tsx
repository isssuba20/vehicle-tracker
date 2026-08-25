import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { useAppStore } from "@/state/store";
import { Vehicle } from "@/types/models";
import { colors, fonts, spacing } from "@/theme/theme";
import { VehicleProvider } from "./vehicleDetail/VehicleContext";
import { OverviewTab } from "./vehicleDetail/OverviewTab";
import { ServiceTab } from "./vehicleDetail/ServiceTab";
import { FuelTab } from "./vehicleDetail/FuelTab";

const Tab = createMaterialTopTabNavigator();

type Props = NativeStackScreenProps<RootStackParamList, "VehicleDetail">;

export function VehicleDetailScreen({ route, navigation }: Props) {
  const { vehicleId } = route.params;
  const vehicles = useAppStore((s) => s.vehicles);
  const [vehicle, setVehicle] = useState<Vehicle | undefined>(
    vehicles.find((v) => v.id === vehicleId)
  );

  useEffect(() => {
    setVehicle(vehicles.find((v) => v.id === vehicleId));
  }, [vehicles, vehicleId]);

  if (!vehicle) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  return (
    <VehicleProvider vehicle={vehicle}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{vehicle.name}</Text>
          <Text style={styles.subtitle}>
            {vehicle.year} {vehicle.make} {vehicle.model} · {vehicle.plateNumber}
          </Text>
        </View>
        <Pressable
          style={styles.editButton}
          onPress={() => navigation.navigate("AddEditVehicle", { vehicleId: vehicle.id })}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </Pressable>
      </View>

      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.ink,
          tabBarInactiveTintColor: colors.inkFaint,
          tabBarIndicatorStyle: { backgroundColor: colors.ink },
          tabBarLabelStyle: { fontFamily: fonts.bodySemiBold, fontSize: 13, textTransform: "none" },
          tabBarStyle: { backgroundColor: colors.paper, elevation: 0, shadowOpacity: 0 },
        }}
      >
        <Tab.Screen name="Overview" component={OverviewTab} />
        <Tab.Screen name="Service" component={ServiceTab} />
        <Tab.Screen name="Fuel" component={FuelTab} />
      </Tab.Navigator>
    </VehicleProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
  },
  editButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.ink,
  },
});
