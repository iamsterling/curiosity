import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { palette } from "../theme";

const tracks = Object.freeze([
  { clips: [[12, 150], [188, 118], [346, 194]], name: "Voice / direction", type: "WAVE" },
  { clips: [[42, 94], [154, 170], [364, 116]], name: "System pulse", type: "MIDI" },
  { clips: [[12, 230], [280, 250]], name: "Interface", type: "WAVE" },
  { clips: [[92, 176], [302, 214]], name: "Score", type: "MIDI" },
]);

const bars = [0.24, 0.58, 0.34, 0.82, 0.46, 0.7, 0.28, 0.9, 0.52, 0.38, 0.76, 0.44];

export const AudioSurface = () => {
  const [playing, setPlaying] = useState(false);

  return (
    <View style={styles.root}>
      <View style={styles.transport}>
        <View>
          <Text style={styles.eyebrow}>AUDIO / FUTURE SURFACE</Text>
          <Text style={styles.title}>Untitled session</Text>
        </View>
        <View style={styles.transportControls}>
          <Pressable
            accessibilityLabel={playing ? "Pause" : "Play"}
            accessibilityRole="button"
            onPress={() => setPlaying((current) => !current)}
            style={({ pressed }) => [styles.play, pressed && styles.pressed]}
          >
            <Text style={styles.playSymbol}>{playing ? "Ⅱ" : "▶"}</Text>
          </Pressable>
          <View style={styles.timeDisplay}>
            <Text style={styles.time}>01:12:08</Text>
            <Text style={styles.timeLabel}>BAR · BEAT · TICK</Text>
          </View>
          <View style={styles.tempo}>
            <Text style={styles.tempoValue}>120.0</Text>
            <Text style={styles.tempoLabel}>BPM</Text>
          </View>
          <View style={styles.tempo}>
            <Text style={styles.tempoValue}>4 / 4</Text>
            <Text style={styles.tempoLabel}>METER</Text>
          </View>
        </View>
        <Text style={styles.preview}>SURFACE CONTRACT PREVIEW</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.trackHeaders}>
          <View style={styles.rulerSpacer}>
            <Text style={styles.panelLabel}>TRACKS</Text>
            <Text style={styles.add}>＋</Text>
          </View>
          {tracks.map((track, index) => (
            <View key={track.name} style={styles.trackHeader}>
              <View style={[styles.trackNumber, index === 0 && styles.trackNumberActive]}>
                <Text style={styles.trackNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.trackIdentity}>
                <Text style={styles.trackName}>{track.name}</Text>
                <Text style={styles.trackType}>{track.type}</Text>
              </View>
              <Text style={styles.trackControl}>M</Text>
              <Text style={styles.trackControl}>S</Text>
            </View>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timelineScroll}>
          <View style={styles.timeline}>
            <View style={styles.ruler}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((beat) => (
                <View key={beat} style={styles.rulerBeat}>
                  <Text style={styles.rulerText}>{beat}</Text>
                </View>
              ))}
            </View>
            {tracks.map((track, trackIndex) => (
              <View key={track.name} style={styles.trackLane}>
                {track.clips.map(([left, clipWidth], clipIndex) => (
                  <View
                    key={`${track.name}-${clipIndex}`}
                    style={[
                      styles.clip,
                      track.type === "MIDI" && styles.midiClip,
                      { left, width: clipWidth },
                    ]}
                  >
                    <Text style={styles.clipLabel}>
                      {track.type === "MIDI" ? "pattern" : `take ${clipIndex + 1}`}
                    </Text>
                    <View style={styles.waveform}>
                      {bars.map((height, barIndex) => (
                        <View
                          key={barIndex}
                          style={[
                            styles.waveBar,
                            track.type === "MIDI" && styles.midiBar,
                            { height: `${height * 100}%` },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ))}
            <View style={[styles.playhead, { left: 258 }]}>
              <View style={styles.playheadCap} />
            </View>
          </View>
        </ScrollView>

        <View style={styles.mixer}>
          <View style={styles.mixerHeader}>
            <Text style={styles.panelLabel}>MIX</Text>
          </View>
          {tracks.map((track, index) => (
            <View key={track.name} style={styles.mixerRow}>
              <Text style={styles.mixerTrack}>{index + 1}</Text>
              <View style={styles.meter}>
                <View style={[styles.meterLevel, { width: `${72 - index * 11}%` }]} />
              </View>
              <Text style={styles.db}>{-3 - index * 2}.0</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.statusStrip}>
        <Text style={styles.status}>44.1 KHZ · 24 BIT</Text>
        <Text style={styles.status}>BUFFER 128</Text>
        <Text style={styles.statusWarning}>AUDIO ENGINE NOT IMPLEMENTED</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  add: { color: palette.textSecondary, fontSize: 16 },
  body: { flex: 1, flexDirection: "row" },
  clip: { backgroundColor: palette.focusQuiet, borderColor: palette.focus, borderRadius: 3, borderWidth: 1, bottom: 8, overflow: "hidden", paddingHorizontal: 6, paddingTop: 5, position: "absolute", top: 8 },
  clipLabel: { color: palette.textSecondary, fontSize: 7, fontWeight: "700" },
  db: { color: palette.textMuted, fontSize: 8, fontVariant: ["tabular-nums"], width: 25 },
  eyebrow: { color: palette.textMuted, fontSize: 8, fontWeight: "800", letterSpacing: 1.1 },
  meter: { backgroundColor: palette.line, flex: 1, height: 3 },
  meterLevel: { backgroundColor: palette.success, height: 3 },
  midiBar: { backgroundColor: palette.warning, height: 2 },
  midiClip: { backgroundColor: palette.surface, borderColor: palette.warning },
  mixer: { backgroundColor: palette.surfaceQuiet, borderLeftColor: palette.line, borderLeftWidth: StyleSheet.hairlineWidth, width: 118 },
  mixerHeader: { borderBottomColor: palette.line, borderBottomWidth: StyleSheet.hairlineWidth, height: 35, justifyContent: "center", paddingHorizontal: 10 },
  mixerRow: { alignItems: "center", borderBottomColor: palette.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 7, height: 72, paddingHorizontal: 9 },
  mixerTrack: { color: palette.textSecondary, fontSize: 9, fontWeight: "700" },
  panelLabel: { color: palette.textMuted, fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  play: { alignItems: "center", backgroundColor: palette.textPrimary, borderRadius: 16, height: 32, justifyContent: "center", width: 32 },
  playSymbol: { color: palette.canvas, fontSize: 11, fontWeight: "800" },
  playhead: { backgroundColor: palette.focus, bottom: 0, position: "absolute", top: 0, width: 1, zIndex: 4 },
  playheadCap: { backgroundColor: palette.focus, height: 7, left: -3, position: "absolute", top: 0, width: 7 },
  pressed: { opacity: 0.58 },
  preview: { color: palette.warning, fontSize: 8, fontWeight: "800", letterSpacing: 0.9 },
  root: { backgroundColor: palette.canvas, flex: 1 },
  ruler: { borderBottomColor: palette.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", height: 35 },
  rulerBeat: { borderLeftColor: palette.line, borderLeftWidth: StyleSheet.hairlineWidth, paddingLeft: 5, paddingTop: 8, width: 100 },
  rulerSpacer: { alignItems: "center", borderBottomColor: palette.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", height: 35, justifyContent: "space-between", paddingHorizontal: 11 },
  rulerText: { color: palette.textMuted, fontSize: 8, fontVariant: ["tabular-nums"] },
  status: { color: palette.textMuted, fontSize: 7, fontWeight: "700", letterSpacing: 0.8 },
  statusStrip: { alignItems: "center", borderTopColor: palette.line, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 20, height: 27, paddingHorizontal: 12 },
  statusWarning: { color: palette.warning, fontSize: 7, fontWeight: "700", letterSpacing: 0.8, marginLeft: "auto" },
  tempo: { alignItems: "center", borderLeftColor: palette.line, borderLeftWidth: StyleSheet.hairlineWidth, minWidth: 54, paddingLeft: 12 },
  tempoLabel: { color: palette.textMuted, fontSize: 7, letterSpacing: 0.8, marginTop: 2 },
  tempoValue: { color: palette.textPrimary, fontSize: 10, fontVariant: ["tabular-nums"] },
  time: { color: palette.textPrimary, fontFamily: "Menlo", fontSize: 13 },
  timeDisplay: { minWidth: 88 },
  timeLabel: { color: palette.textMuted, fontSize: 6, letterSpacing: 0.6, marginTop: 2 },
  timeline: { minHeight: 323, position: "relative", width: 800 },
  timelineScroll: { flex: 1 },
  title: { color: palette.textPrimary, fontSize: 15, fontWeight: "700", marginTop: 3 },
  trackControl: { borderColor: palette.line, borderRadius: 3, borderWidth: 1, color: palette.textMuted, fontSize: 7, overflow: "hidden", paddingHorizontal: 4, paddingVertical: 3 },
  trackHeader: { alignItems: "center", borderBottomColor: palette.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 7, height: 72, paddingHorizontal: 8 },
  trackHeaders: { backgroundColor: palette.surfaceQuiet, borderRightColor: palette.line, borderRightWidth: StyleSheet.hairlineWidth, width: 184 },
  trackIdentity: { flex: 1 },
  trackLane: { borderBottomColor: palette.line, borderBottomWidth: StyleSheet.hairlineWidth, height: 72, position: "relative" },
  trackName: { color: palette.textPrimary, fontSize: 10, fontWeight: "600" },
  trackNumber: { alignItems: "center", borderColor: palette.line, borderRadius: 10, borderWidth: 1, height: 20, justifyContent: "center", width: 20 },
  trackNumberActive: { borderColor: palette.focus },
  trackNumberText: { color: palette.textSecondary, fontSize: 8, fontWeight: "700" },
  trackType: { color: palette.textMuted, fontSize: 7, letterSpacing: 0.7, marginTop: 3 },
  transport: { alignItems: "center", borderBottomColor: palette.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", height: 66, justifyContent: "space-between", paddingHorizontal: 16 },
  transportControls: { alignItems: "center", flexDirection: "row", gap: 13 },
  waveBar: { backgroundColor: palette.focus, maxHeight: 23, minHeight: 2, opacity: 0.75, width: 2 },
  waveform: { alignItems: "center", bottom: 5, flexDirection: "row", gap: 3, left: 6, position: "absolute", right: 6, top: 21 },
});
