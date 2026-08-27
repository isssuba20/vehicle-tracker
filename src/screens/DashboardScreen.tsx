import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { TabScreenProps } from "@/navigation/types";
import { useAppStore } from "@/state/store";
import { useCurrencyStore } from "@/state/useCurrencyStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HomeTab } from "./dashboard/HomeTab";
import { TrendsTab } from "./dashboard/TrendsTab";
import { MarkDoneSheet, RenewalKind } from "./vehicleDetail/MarkDoneSheet";
import { fonts, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { getEfficiencyDisplay, EfficiencyDisplay } from "@/utils/vehicleEfficiencyDisplay";
import {
  getAllExpenses,
  getActionItems,
  getFleetInsights,
  getMonthTotal,
  getMonthlySpendSeries,
  getSpendByCategory,
  ActionItem,
} from "@/services/fleetAnalytics";
import { getHouseholdOwnershipCosts, getOwnershipComparison } from "@/services/ownershipCost";

type Props = TabScreenProps<"Dashboard">;

const Tab = createMaterialTopTabNavigator();

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
    refreshVehicles,
    refreshGroups,
  } = useAppStore();
  const colors = useThemeStore((s) => s.colors);
  const currencyCode = useCurrencyStore((s) => s.code);
  const styles = makeStyles(colors);
  const insets = useSafeAreaInsets();
  const [markDone, setMarkDone] = useState<{ kind: RenewalKind; vehicleId: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const groupId = groupIds[0];

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshVehicles();
      await refreshGroups();
      await Promise.all(vehicles.map((v) => loadVehicleDetail(v.id)));
      if (groupId) await loadMembers(groupId);
    } finally {
      setRefreshing(false);
    }
  }

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
  const monthlySeries = useMemo(() => getMonthlySpendSeries(expenses, 6), [expenses]);
  const categoryTotals = useMemo(() => getSpendByCategory(expenses), [expenses]);
  const ownershipComparison = useMemo(() => {
    const costs = getHouseholdOwnershipCosts(vehicles, expenses);
    return getOwnershipComparison(costs);
  }, [vehicles, expenses]);
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <ThemeToggle colors={colors} />
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
        <Tab.Screen name="Home">
          {() => (
            <HomeTab
              navigation={navigation}
              vehicles={vehicles}
              actionItems={actionItems}
              efficiencyByVehicle={efficiencyByVehicle}
              memberNameById={memberNameById}
              currentMemberName={currentMemberName}
              updateVehicle={updateVehicle}
              onMarkDone={openMarkDone}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Trends">
          {() => (
            <TrendsTab
              insights={insights}
              expenses={expenses}
              monthlySeries={monthlySeries}
              categoryTotals={categoryTotals}
              actualThisMonth={actualThisMonth}
              household={household}
              currencyCode={currencyCode}
              ownershipComparison={ownershipComparison}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>

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
    topBar: {
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xs,
    },
  });
