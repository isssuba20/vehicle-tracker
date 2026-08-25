import React from "react";
import { View, StyleSheet } from "react-native";
import { Urgency } from "@/types/models";
import { urgencyColor } from "@/theme/theme";

export function UrgencyDot({ urgency, size = 10 }: { urgency: Urgency; size?: number }) {
  return (
    <View
      style={[
        styles.dot,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: urgencyColor(urgency) },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    marginRight: 4,
  },
});
