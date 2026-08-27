import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, radii, spacing, ThemeColors, urgencyColor, urgencyLabel } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { formatDate } from "@/utils/format";
import { ActionItem } from "@/services/fleetAnalytics";
import { Urgency } from "@/types/models";

const URGENCY_RANK: Record<Urgency, number> = { overdue: 0, due_soon: 1, ok: 2 };

interface VehicleGroup {
  vehicleId: string;
  vehicleName: string;
  worstUrgency: Urgency;
  items: ActionItem[];
}

/**
 * "What needs my attention right now" — aggregated overdue/due-soon items
 * across every household vehicle, grouped by vehicle and collapsed by
 * default so this doesn't turn into a wall of rows once a household has
 * more than one or two vehicles with something due. The group header
 * alone (name + count + worst-urgency color) is enough to scan at a
 * glance; expanding one shows its individual items.
 */
export function ActionCenter({
  items,
  onMarkDone,
}: {
  items: ActionItem[];
  onMarkDone: (item: ActionItem) => void;
}) {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const groups = useMemo<VehicleGroup[]>(() => {
    const byVehicle = new Map<string, VehicleGroup>();
    for (const item of items) {
      const existing = byVehicle.get(item.vehicleId);
      if (existing) {
        existing.items.push(item);
        if (URGENCY_RANK[item.urgency] < URGENCY_RANK[existing.worstUrgency]) {
          existing.worstUrgency = item.urgency;
        }
      } else {
        byVehicle.set(item.vehicleId, {
          vehicleId: item.vehicleId,
          vehicleName: item.vehicleName,
          worstUrgency: item.urgency,
          items: [item],
        });
      }
    }
    // `items` already arrives sorted most-urgent-first, so the first
    // vehicle encountered for each urgency tier keeps that ordering here.
    return [...byVehicle.values()];
  }, [items]);

  function toggle(vehicleId: string) {
    setExpanded((prev) => ({ ...prev, [vehicleId]: !prev[vehicleId] }));
  }

  return (
    <View style={styles.container}>
      {groups.map((group, i) => {
        const isOpen = !!expanded[group.vehicleId];
        return (
          <View key={group.vehicleId} style={i > 0 ? styles.groupDivider : undefined}>
            <Pressable
              style={styles.groupHeader}
              onPress={() => toggle(group.vehicleId)}
              accessibilityRole="button"
              accessibilityLabel={`${group.vehicleName}, ${group.items.length} item${
                group.items.length === 1 ? "" : "s"
              } needing attention, worst status ${urgencyLabel(group.worstUrgency)}. ${
                isOpen ? "Expanded" : "Collapsed"
              }`}
            >
              <View style={[styles.bar, { backgroundColor: urgencyColor(group.worstUrgency) }]} />
              <Text style={styles.groupName} numberOfLines={1}>
                {group.vehicleName}
              </Text>
              <Text style={styles.groupCount}>
                {group.items.length} {group.items.length === 1 ? "item" : "items"}
              </Text>
              <Ionicons
                name={isOpen ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.textFaint}
                style={styles.chevron}
              />
            </Pressable>

            {isOpen &&
              group.items.map((item, j) => (
                <View
                  key={`${item.vehicleId}-${item.kind}`}
                  style={[styles.row, j > 0 && styles.rowDivider]}
                >
                  <View style={[styles.itemBar, { backgroundColor: urgencyColor(item.urgency) }]} />
                  <View style={styles.rowContent}>
                    <Text style={styles.title}>{item.label}</Text>
                    <Text style={styles.subtitle}>
                      {item.urgency === "overdue" ? "Overdue since " : "Due "}
                      {formatDate(item.dateLabel)}
                    </Text>
                  </View>
                  <Pressable onPress={() => onMarkDone(item)} hitSlop={8}>
                    <Text style={styles.action}>Mark done</Text>
                  </Pressable>
                </View>
              ))}
          </View>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    groupDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    groupHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.sm + 2,
      paddingRight: spacing.md,
    },
    bar: {
      width: 3,
      alignSelf: "stretch",
      marginRight: spacing.sm + 2,
    },
    groupName: {
      flex: 1,
      fontFamily: fonts.bodySemiBold,
      fontSize: 14,
      color: colors.textPrimary,
    },
    groupCount: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textMuted,
      marginRight: spacing.xs,
    },
    chevron: {
      marginLeft: 2,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.sm + 2,
      paddingRight: spacing.md,
      paddingLeft: spacing.lg,
      backgroundColor: colors.background,
    },
    rowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    itemBar: {
      width: 3,
      alignSelf: "stretch",
      marginRight: spacing.sm + 2,
    },
    rowContent: {
      flex: 1,
    },
    title: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.textPrimary,
    },
    subtitle: {
      fontFamily: fonts.mono,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    action: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: colors.accent,
      marginLeft: spacing.sm,
    },
  });
