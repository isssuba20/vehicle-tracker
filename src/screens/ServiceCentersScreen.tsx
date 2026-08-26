import React, { useEffect, useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useAppStore } from "@/state/store";
import { useCurrencyStore } from "@/state/useCurrencyStore";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { formatDate, formatMoney } from "@/utils/format";
import { getServiceCenterSummaries } from "@/services/serviceCenters";

export function ServiceCentersScreen() {
  const { vehicles, serviceByVehicle, loadVehicleDetail } = useAppStore();
  const currencyCode = useCurrencyStore((s) => s.code);
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);

  useEffect(() => {
    vehicles.forEach((v) => loadVehicleDetail(v.id));
  }, [vehicles.length]);

  const summaries = useMemo(
    () => getServiceCenterSummaries(vehicles, serviceByVehicle),
    [vehicles, serviceByVehicle]
  );

  if (summaries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No service history yet</Text>
        <Text style={styles.emptyBody}>
          Log a service with a shop name and it'll show up here, grouped by where you had it done.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}>
      {summaries.map((s) => (
        <View key={s.shop} style={styles.card}>
          <Text style={styles.shop}>{s.shop}</Text>
          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statLabel}>Visits</Text>
              <Text style={styles.statValue}>{s.visits}</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>Total spent</Text>
              <Text style={styles.statValue}>{formatMoney(s.totalSpent, currencyCode)}</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>Avg. visit</Text>
              <Text style={styles.statValue}>{formatMoney(s.averageVisit, currencyCode)}</Text>
            </View>
          </View>
          <Text style={styles.meta}>
            Last visit {formatDate(s.lastVisitDate)} · {s.vehicleNames.join(", ")}
          </Text>
          <Text style={styles.meta}>{s.serviceTypes.join(" · ")}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    shop: {
      fontFamily: fonts.display,
      fontSize: 17,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    statsRow: {
      flexDirection: "row",
      gap: spacing.xl,
      marginBottom: spacing.sm,
    },
    statLabel: {
      fontFamily: fonts.body,
      fontSize: 11,
      color: colors.textFaint,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    statValue: {
      fontFamily: fonts.mono,
      fontSize: 15,
      color: colors.textPrimary,
      marginTop: 2,
    },
    meta: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    empty: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xl,
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
    },
  });
