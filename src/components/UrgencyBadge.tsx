import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Urgency } from "@/types/models";
import { fonts, radii, urgencyColor, urgencyOnColor, urgencyLabel } from "@/theme/theme";

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return (
    <View style={[styles.badge, { backgroundColor: urgencyColor(urgency) }]}>
      <Text style={[styles.text, { color: urgencyOnColor(urgency) }]}>
        {urgencyLabel(urgency)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
  },
});
