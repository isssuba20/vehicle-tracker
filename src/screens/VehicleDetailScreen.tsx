import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { useAppStore } from "@/state/store";
import { Vehicle } from "@/types/models";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import { VehicleProvider } from "./vehicleDetail/VehicleContext";
import { OverviewTab } from "./vehicleDetail/OverviewTab";
import { ServiceTab } from "./vehicleDetail/ServiceTab";
import { FuelTab } from "./vehicleDetail/FuelTab";
import { ChargingTab } from "./vehicleDetail/ChargingTab";
import { TimelineTab } from "./vehicleDetail/TimelineTab";

const Tab = createMaterialTopTabNavigator();

type Props = NativeStackScreenProps<RootStackParamList, "VehicleDetail">;

export function VehicleDetailScreen({ route, navigation }: Props) {
  const { vehicleId } = route.params;
  const vehicles = useAppStore((s) => s.vehicles);
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);
  const [vehicle, setVehicle] = useState<Vehicle | undefined>(
    vehicles.find((v) => v.id === vehicleId)
  );

  useEffect(() => {
    setVehicle(vehicles.find((v) => v.id === vehicleId));
  }, [vehicles, vehicleId]);

  if (!vehicle) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
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
        <View style={styles.headerActions}>
          <ThemeToggle colors={colors} />
          <Pressable
            style={styles.editButton}
            onPress={() => navigation.navigate("AddEditVehicle", { vehicleId: vehicle.id })}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        </View>
      </View>

      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textFaint,
          tabBarIndicatorStyle: { backgroundColor: colors.accent },
          tabBarLabelStyle: { fontFamily: fonts.bodySemiBold, fontSize: 13, textTransform: "none" },
          tabBarStyle: { backgroundColor: colors.background, elevation: 0, shadowOpacity: 0 },
        }}
      >
        <Tab.Screen name="Overview" component={OverviewTab} />
        <Tab.Screen name="Service" component={ServiceTab} />
        {vehicle.fuelType === "electric" ? (
          <Tab.Screen name="Charging" component={ChargingTab} />
        ) : (
          <Tab.Screen name="Fuel" component={FuelTab} />
        )}
        <Tab.Screen name="Timeline" component={TimelineTab} />
      </Tab.Navigator>
    </VehicleProvider>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    center: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    name: {
      fontFamily: fonts.display,
      fontSize: 22,
      color: colors.textPrimary,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    editButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    editButtonText: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 13,
      color: colors.textPrimary,
    },
  });
