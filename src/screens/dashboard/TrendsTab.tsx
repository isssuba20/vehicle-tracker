import React from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import { Group } from "@/types/models";
import { FleetIntelligenceCard } from "@/components/FleetIntelligenceCard";
import { HouseholdBudgetCard } from "@/components/HouseholdBudgetCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { OwnershipComparisonCard } from "@/components/OwnershipComparisonCard";
import { SpendTrendChart } from "@/components/charts/SpendTrendChart";
import { SpendByCategoryChart } from "@/components/charts/SpendByCategoryChart";
import { fonts, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { Insight, UnifiedExpense, ExpenseCategory, MonthlySpend } from "@/services/fleetAnalytics";
import { OwnershipComparison } from "@/services/ownershipCost";

const MIN_EXPENSES_FOR_INSIGHTS = 4;

/** Everything derived from spending history — charts and computed insight cards, nothing you edit here. */
export function TrendsTab({
  insights,
  expenses,
  monthlySeries,
  categoryTotals,
  actualThisMonth,
  household,
  currencyCode,
  ownershipComparison,
}: {
  insights: Insight[];
  expenses: UnifiedExpense[];
  monthlySeries: MonthlySpend[];
  categoryTotals: Record<ExpenseCategory, number>;
  actualThisMonth: number;
  household: Group | undefined;
  currencyCode: string;
  ownershipComparison: OwnershipComparison | null;
}) {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xl * 2 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionTitle}>Monthly spending</Text>
      <View style={styles.section}>
        <SpendTrendChart series={monthlySeries} currencyCode={currencyCode} />
      </View>

      <Text style={styles.sectionTitle}>Where it goes</Text>
      <View style={styles.section}>
        <SpendByCategoryChart totals={categoryTotals} currencyCode={currencyCode} />
      </View>

      <Text style={styles.sectionTitle}>Fleet intelligence</Text>
      <View style={styles.section}>
        <FleetIntelligenceCard insights={insights} learning={expenses.length < MIN_EXPENSES_FOR_INSIGHTS} />
      </View>

      {ownershipComparison && (
        <>
          <Text style={styles.sectionTitle}>Cost to own</Text>
          <View style={styles.section}>
            <OwnershipComparisonCard comparison={ownershipComparison} currencyCode={currencyCode} />
          </View>
        </>
      )}

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
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.md,
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
  });
