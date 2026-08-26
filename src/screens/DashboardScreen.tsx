import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabScreenProps } from "@/navigation/types";
import { useAppStore } from "@/state/store";
import { useCurrencyStore } from "@/state/useCurrencyStore";
import { VehicleCard } from "@/components/VehicleCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { ActionCenter } from "@/components/ActionCenter";
import { FleetIntelligenceCard } from "@/components/FleetIntelligenceCard";
import { HouseholdBudgetCard } from "@/components/HouseholdBudgetCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { MarkDoneSheet, RenewalKind } from "./vehicleDetail/MarkDoneSheet";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { getEfficiencyDisplay, EfficiencyDisplay } from "@/utils/vehicleEfficiencyDisplay";
import {
  getAllExpenses,
  getActionItems,
  getFleetInsights,
  getMonthTotal,
  ActionItem,
} from "@/services/fleetAnalytics";

type Props = TabScreenProps<"Dashboard">;

const MIN_EXPENSES_FOR_INSIGHTS = 4;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardScreen({ navigation }: Props) {
  const {
    ready,
    vehicles,
    fuelByVehicle,
    serviceByVehicle,
    chargingByVehicle,
    loadVehicleDetail,
    updateVehicle,
    groupIds,
    groups,
    members,
    loadMembers,
    currentUserId,
  } = useAppStore();
  const colors = useThemeStore((s) => s.colors);
  const currencyCode = useCurrencyStore((s) => s.code);
  const styles = makeStyles(colors);
  const insets = useSafeAreaInsets();
  const [markDone, setMarkDone] = useState<{ kind: RenewalKind; vehicleId: string } | null>(null);

  const groupId = groupIds[0];

  useEffect(() => {
    // Prime fuel/service/charging history for each vehicle so the dashboard
    // can show efficiency, action items, and spending without waiting for
    // the detail screen to be opened first.
    vehicles.forEach((v) => loadVehicleDetail(v.id));
  }, [vehicles.length]);

  useEffect(() => {
    if (groupId) loadMembers(groupId);
  }, [groupId]);

  const memberNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of members) map[m.userId] = m.displayName;
    return map;
  }, [members]);

  const efficiencyByVehicle = useMemo(() => {
    const map: Record<string, EfficiencyDisplay> = {};
    for (const v of vehicles) {
      map[v.id] = getEfficiencyDisplay(v, fuelByVehicle[v.id] ?? [], chargingByVehicle[v.id] ?? []);
    }
    return map;
  }, [vehicles, fuelByVehicle, chargingByVehicle]);

  const actionItems = useMemo(() => getActionItems(vehicles), [vehicles]);

  const expenses = useMemo(
    () => getAllExpenses(vehicles, fuelByVehicle, serviceByVehicle, chargingByVehicle),
    [vehicles, fuelByVehicle, serviceByVehicle, chargingByVehicle]
  );

  const insights = useMemo(() => getFleetInsights(expenses), [expenses]);
  const actualThisMonth = useMemo(() => getMonthTotal(expenses, 0), [expenses]);
  const household = groups.find((g) => g.id === groupId);
  const currentMemberName = memberNameById[currentUserId];

  const markDoneVehicle = markDone ? vehicles.find((v) => v.id === markDone.vehicleId) : undefined;

  function openMarkDone(item: ActionItem) {
    setMarkDone({ kind: item.kind, vehicleId: item.vehicleId });
  }

  if (!ready) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading your garage…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: spacing.lg + insets.top }]}>
      <FlatList
        data={vehicles}
        keyExtractor={(v) => v.id}
        contentContainerStyle={{ paddingBottom: spacing.xl * 3 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.greeting}>
                  {greeting()}
                  {currentMemberName ? `, ${currentMemberName}` : ""}
                </Text>
                <Text style={styles.greetingSub}>
                  {actionItems.length === 0
                    ? "Your household is all caught up"
                    : `${actionItems.length} thing${actionItems.length === 1 ? "" : "s"} need${
                        actionItems.length === 1 ? "s" : ""
                      } your attention`}
                </Text>
              </View>
              <ThemeToggle colors={colors} />
            </View>

            {actionItems.length > 0 && (
              <View style={styles.section}>
                <ActionCenter items={actionItems} onMarkDone={openMarkDone} />
              </View>
            )}

            {vehicles.length > 0 && <Text style={styles.sectionTitle}>Your fleet</Text>}
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No vehicles yet</Text>
            <Text style={styles.emptyBody}>
              Add your first vehicle to start tracking service, fuel, and renewals.
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
        ListFooterComponent={
          vehicles.length === 0 ? null : (
            <>
              <Text style={styles.sectionTitle}>Fleet intelligence</Text>
              <View style={styles.section}>
                <FleetIntelligenceCard insights={insights} learning={expenses.length < MIN_EXPENSES_FOR_INSIGHTS} />
              </View>

              <Text style={styles.sectionTitle}>Household budget</Text>
              <View style={styles.section}>
                <HouseholdBudgetCard
                  monthlyBudget={household?.monthlyBudget}
                  actual={actualThisMonth}
                  currencyCode={currencyCode}
                />
              </View>

              <Text style={styles.sectionTitle}>Recent activity</Text>
              <ActivityFeed expenses={expenses} currencyCode={currencyCode} />
            </>
          )
        }
      />
      <AnimatedPressable
        style={[styles.addButton, { bottom: spacing.md + insets.bottom }]}
        onPress={() => navigation.navigate("AddEditVehicle", {})}
      >
        <Text style={styles.addButtonText}>+ Add a vehicle</Text>
      </AnimatedPressable>

      {markDone && markDoneVehicle && (
        <MarkDoneSheet
          kind={markDone.kind}
          visible={!!markDone}
          vehicle={markDoneVehicle}
          onClose={() => setMarkDone(null)}
        />
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.md,
    },
    center: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      fontFamily: fonts.body,
      color: colors.textMuted,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: spacing.lg,
    },
    greeting: {
      fontFamily: fonts.display,
      fontSize: 24,
      color: colors.textPrimary,
    },
    greetingSub: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontFamily: fonts.body,
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: colors.textFaint,
      marginBottom: spacing.sm,
      marginTop: spacing.xs,
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
      position: "absolute",
      left: spacing.md,
      right: spacing.md,
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
