import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, RefreshControl, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TabParamList, RootStackParamList } from "@/navigation/types";
import { Vehicle } from "@/types/models";
import { VehicleCard } from "@/components/VehicleCard";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { EfficiencyDisplay } from "@/utils/vehicleEfficiencyDisplay";

/** Below this fleet size a search bar is just clutter — nothing to narrow down yet. */
const SEARCH_MIN_VEHICLES = 4;

type DashboardNav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Dashboard">,
  NativeStackNavigationProp<RootStackParamList>
>;

/** The household's vehicles — separate from Home, which is only ever what needs attention. */
export function FleetTab({
  navigation,
  vehicles,
  efficiencyByVehicle,
  memberNameById,
  updateVehicle,
  refreshing,
  onRefresh,
}: {
  navigation: DashboardNav;
  vehicles: Vehicle[];
  efficiencyByVehicle: Record<string, EfficiencyDisplay>;
  memberNameById: Record<string, string>;
  updateVehicle: (v: Vehicle) => void;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((v) =>
      [v.name, v.make, v.model, v.plateNumber].some((field) => field.toLowerCase().includes(q))
    );
  }, [vehicles, query]);

  const showSearch = vehicles.length >= SEARCH_MIN_VEHICLES;

  return (
    <View style={styles.container}>
      {showSearch && (
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={colors.textFaint} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, make, model, or plate"
            placeholderTextColor={colors.textFaint}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery("")}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={16} color={colors.textFaint} />
            </Pressable>
          )}
        </View>
      )}
      <FlatList
        data={filtered}
        keyExtractor={(v) => v.id}
        style={styles.list}
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.md }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{query ? "No matches" : "No vehicles yet"}</Text>
            <Text style={styles.emptyBody}>
              {query
                ? "Try a different name, make, model, or plate number."
                : "Add your first vehicle to start tracking service, fuel, and renewals."}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <VehicleCard
            vehicle={item}
            efficiency={
              efficiencyByVehicle[item.id] ?? { label: "Fuel efficiency", text: "—", implausible: false }
            }
            driverName={item.primaryDriverUserId ? memberNameById[item.primaryDriverUserId] : undefined}
            onPress={() => navigation.navigate("VehicleDetail", { vehicleId: item.id })}
            onPhotoChange={(photoUri) => updateVehicle({ ...item, photoUri })}
          />
        )}
      />
      <View style={[styles.footer, { paddingBottom: spacing.md + insets.bottom }]}>
        <AnimatedPressable style={styles.addButton} onPress={() => navigation.navigate("AddEditVehicle", {})}>
          <Text style={styles.addButtonText}>+ Add a vehicle</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    list: {
      paddingHorizontal: spacing.md,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs + 2,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    searchInput: {
      flex: 1,
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textPrimary,
      padding: 0,
    },
    footer: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    empty: {
      paddingVertical: spacing.xl,
      alignItems: "center",
    },
    emptyTitle: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 16,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    emptyBody: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textMuted,
      textAlign: "center",
      paddingHorizontal: spacing.lg,
    },
    addButton: {
      backgroundColor: colors.accent,
      borderRadius: radii.lg,
      paddingVertical: spacing.md,
      alignItems: "center",
    },
    addButtonText: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 16,
      color: colors.onAccent,
    },
  });
