// components/ImageEditor.tsx
import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  PanResponder,
  useWindowDimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useAppColors from "@/theme/useAppColors";
import { IMAGE_URL } from "@/const";

const DEFAULT_QUALITY = 80;
const ZOOM_MIN = 1.0;
const ZOOM_MAX = 4.0;
const ZOOM_STEP = 0.25;

// ─── Types ────────────────────────────────────────────────────────────────────
type CropMode = "square" | "l-4:3" | "l-16:9" | "p-3:4" | "p-9:16";

interface RatioDef {
  mode: CropMode;
  label: string;
  ratio: number;
  iconW: number;
  iconH: number;
}
const RATIO_DEFS: RatioDef[] = [
  { mode: "square", label: "square", ratio: 1, iconW: 16, iconH: 16 },
  { mode: "l-4:3", label: "4 : 3", ratio: 4 / 3, iconW: 20, iconH: 15 },
  { mode: "l-16:9", label: "16 : 9", ratio: 16 / 9, iconW: 24, iconH: 14 },
  { mode: "p-3:4", label: "3 : 4", ratio: 3 / 4, iconW: 15, iconH: 20 },
  { mode: "p-9:16", label: "9 : 16", ratio: 9 / 16, iconW: 14, iconH: 24 },
];
const ratioOf = (m: CropMode) => RATIO_DEFS.find((r) => r.mode === m)!.ratio;

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface UploadResult {
  cloudUrl: string;
  width: number;
  height: number;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

// ─── Pure helper (no hooks, no closure deps) ─────────────────────────────────
function computeImageBounds(iw: number, ih: number, W: number, IMG_H: number) {
  if (!iw || !ih) return { x: 0, y: 0, w: W, h: IMG_H };
  const scale = Math.min(W / iw, IMG_H / ih);
  const rw = iw * scale;
  const rh = ih * scale;
  return { x: (W - rw) / 2, y: (IMG_H - rh) / 2, w: rw, h: rh };
}

function computeCropRect(
  b: { x: number; y: number; w: number; h: number },
  ratio: number,
  pad = 0.04,
): CropRect {
  const maxW = b.w * (1 - pad * 2);
  const maxH = b.h * (1 - pad * 2);
  let rw = maxW;
  let rh = rw / ratio;
  if (rh > maxH) {
    rh = maxH;
    rw = rh * ratio;
  }
  return {
    x: b.x + (b.w - rw) / 2,
    y: b.y + (b.h - rh) / 2,
    w: rw,
    h: rh,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// uploadImageToCloud
// ═════════════════════════════════════════════════════════════════════════════
export async function uploadImageToCloud(
  localUri: string,
  uploadUrl: string,
  token: string,
  filename?: string,
): Promise<string> {
  const formData = new FormData();

  // Detect extension safely
  const extMatch = localUri.match(/\.(\w+)(\?.*)?$/);
  const ext = extMatch?.[1]?.toLowerCase() || "jpg";

  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };

  const type = mimeMap[ext] || "image/jpeg";
  const name = filename || `upload.${ext}`;

  formData.append("file", {
    uri: localUri,
    name,
    type,
  } as any);

  // Token extraction (cleaned)
  // const rawToken = authStore$.token.get();
  // const token =
  //   typeof rawToken === "string"
  //     ? rawToken
  //     : ((rawToken as any)?.data?.token ?? (rawToken as any)?.token ?? null);

  // if (!token) {
  //   throw new Error("Authentication token missing");
  // }

  try {
    // Add timeout (VERY important for mobile)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 seconds

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Upload failed (${response.status}): ${text}`);
    }

    const json = await response.json();

    const key: string | undefined = json?.data?.key;
    const cloudUrl: string | undefined =
      json?.url ??
      json?.data?.url ??
      json?.secure_url ??
      (key ? `${IMAGE_URL}/${key}` : undefined);

    if (!cloudUrl) {
      throw new Error("No URL returned from server");
    }

    return cloudUrl;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Upload timeout. Please try again.");
    }

    console.error("Upload error:", error);
    throw error;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Style Generator Hook
// ═════════════════════════════════════════════════════════════════════════════
const useStyles = () => {
  const colors = useAppColors();
  return useMemo(() => {
    return {
      colors,
      zs: StyleSheet.create({
        container: {
          position: "absolute",
          bottom: 14,
          right: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          zIndex: 20,
        },
        btn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "rgba(0,0,0,0.6)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.22)",
          alignItems: "center",
          justifyContent: "center",
        },
        btnDim: { opacity: 0.3 },
        pill: {
          height: 28,
          paddingHorizontal: 10,
          borderRadius: 14,
          backgroundColor: "rgba(0,0,0,0.6)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.22)",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 54,
        },
        pillTxt: {
          fontSize: 11,
          fontWeight: "700",
          color: "#FFF",
          letterSpacing: 0.4,
        },
      }),
      rc: StyleSheet.create({
        row: {
          flexDirection: "row",
          alignItems: "flex-start",
          paddingRight: 12,
        },
        divider: {
          width: 1,
          height: 30,
          backgroundColor: colors.border,
          alignSelf: "center",
          marginHorizontal: 10,
        },
        groupWrap: { alignItems: "flex-start", gap: 4 },

        chips: { flexDirection: "row", gap: 6 },
        chip: {
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 10,
          paddingVertical: 7,
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: colors.border,
          gap: 5,
          minWidth: 56,
        },
        chipOn: {
          borderColor: colors.primary,
          backgroundColor: colors.primary + "1A",
        }, // 10% opacity primary
        icon: {
          borderWidth: 1.5,
          borderColor: colors.textMuted,
          borderRadius: 2,
        },
        iconOn: { borderColor: colors.primary },
        lbl: {
          fontSize: 10,
          color: colors.textMuted,
          fontWeight: "500",
          maxWidth: 72,
          textAlign: "center",
        },
        lblOn: { color: colors.primary, fontWeight: "700" },
      }),
      pk: StyleSheet.create({
        row: {
          flexDirection: "row",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        },
        btn: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        },
        lbl: { fontSize: 14, color: colors.text, fontWeight: "600" },
        div: { width: 1, height: 44, backgroundColor: colors.border },
      }),
      ov: StyleSheet.create({
        wrap: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: colors.overlay,
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          gap: 14,
        },
        txt: { color: colors.textInverse, fontSize: 16, fontWeight: "700" },
        sub: { color: colors.textInverse, opacity: 0.8, fontSize: 12 },
      }),
      s: StyleSheet.create({
        topBar: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 14,
        },
        topTitle: {
          fontSize: 14,
          fontWeight: "700",
          color: "#FFF",
          letterSpacing: 0.3,
        },
        iconBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "rgba(255,255,255,0.15)",
          alignItems: "center",
          justifyContent: "center",
        },
        saveBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.success,
          alignItems: "center",
          justifyContent: "center",
        },
        undoRow: { flexDirection: "row", alignItems: "center", gap: 14 },
        undoBtn: { padding: 4 },
        emptyBody: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          paddingHorizontal: 36,
          backgroundColor: colors.background,
        },
        emptyIcon: {
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: colors.surfaceVariant,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 4,
        },
        emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
        emptyHint: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
        panel: {
          flex: 1,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 8,
          backgroundColor: colors.surface,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
      }),
    };
  }, [colors]);
};

// ═════════════════════════════════════════════════════════════════════════════
// Sub-components
// ═════════════════════════════════════════════════════════════════════════════

const ZoomControls: React.FC<{
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zs: any;
}> = ({ zoom, onZoomIn, onZoomOut, zs }) => (
  <View style={zs.container}>
    <TouchableOpacity
      style={[zs.btn, zoom <= ZOOM_MIN && zs.btnDim]}
      onPress={onZoomOut}
      activeOpacity={0.75}
      disabled={zoom <= ZOOM_MIN}
    >
      <Feather name="minus" size={16} color="#FFF" />
    </TouchableOpacity>
    <View style={zs.pill}>
      <Text style={zs.pillTxt}>{Math.round(zoom * 100)}%</Text>
    </View>
    <TouchableOpacity
      style={[zs.btn, zoom >= ZOOM_MAX && zs.btnDim]}
      onPress={onZoomIn}
      activeOpacity={0.75}
      disabled={zoom >= ZOOM_MAX}
    >
      <Feather name="plus" size={16} color="#FFF" />
    </TouchableOpacity>
  </View>
);

const CropOverlay: React.FC<{
  containerW: number;
  containerH: number;
  cropMode: CropMode;
  cropRect: CropRect;
  onCropChange: (r: CropRect) => void;
  primaryColor: string;
  imageBounds: { x: number; y: number; w: number; h: number };
}> = ({
  containerW,
  containerH,
  cropMode,
  cropRect,
  onCropChange,
  primaryColor,
  imageBounds,
}) => {
  const { x, y, w, h } = cropRect;
  const MIN = 60;
  const rectRef = useRef(cropRect);
  const modeRef = useRef(cropMode);
  const imageBoundsRef = useRef(imageBounds);
  const onCropChangeRef = useRef(onCropChange);

  useEffect(() => {
    rectRef.current = cropRect;
  }, [cropRect]);
  useEffect(() => {
    modeRef.current = cropMode;
  }, [cropMode]);
  useEffect(() => {
    imageBoundsRef.current = imageBounds;
  }, [imageBounds]);
  useEffect(() => {
    onCropChangeRef.current = onCropChange;
  }, [onCropChange]);

  // ── Move (drag whole rect) ──────────────────────────────────────────────
  const moveStart = useRef({ rx: 0, ry: 0, tx: 0, ty: 0 });
  const movePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant(e) {
        moveStart.current = {
          rx: rectRef.current.x,
          ry: rectRef.current.y,
          tx: e.nativeEvent.pageX,
          ty: e.nativeEvent.pageY,
        };
      },
      onPanResponderMove(e) {
        const r = rectRef.current;
        const b = imageBoundsRef.current;
        const dx = e.nativeEvent.pageX - moveStart.current.tx;
        const dy = e.nativeEvent.pageY - moveStart.current.ty;
        onCropChangeRef.current({
          ...r,
          x: clamp(moveStart.current.rx + dx, b.x, b.x + b.w - r.w),
          y: clamp(moveStart.current.ry + dy, b.y, b.y + b.h - r.h),
        });
      },
    }),
  ).current;

  // ── Bottom-right resize handle ──────────────────────────────────────────
  const brStart = useRef({ w: 0, h: 0, tx: 0, ty: 0 });
  const brPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant(e) {
        brStart.current = {
          w: rectRef.current.w,
          h: rectRef.current.h,
          tx: e.nativeEvent.pageX,
          ty: e.nativeEvent.pageY,
        };
      },
      onPanResponderMove(e) {
        const r = rectRef.current;
        const b = imageBoundsRef.current;
        const ratio = ratioOf(modeRef.current);
        const dx = e.nativeEvent.pageX - brStart.current.tx;
        let nw = clamp(brStart.current.w + dx, MIN, b.x + b.w - r.x);
        let nh = nw / ratio;
        nh = clamp(nh, MIN, b.y + b.h - r.y);
        nw = clamp(nh * ratio, MIN, b.x + b.w - r.x);
        onCropChangeRef.current({ ...r, w: nw, h: nh });
      },
    }),
  ).current;

  // ── Top-left resize handle ──────────────────────────────────────────────
  const tlStart = useRef({ x: 0, y: 0, w: 0, h: 0, tx: 0, ty: 0 });
  const tlPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant(e) {
        tlStart.current = {
          ...rectRef.current,
          tx: e.nativeEvent.pageX,
          ty: e.nativeEvent.pageY,
        };
      },
      onPanResponderMove(e) {
        const ratio = ratioOf(modeRef.current);
        const t = tlStart.current;
        const b = imageBoundsRef.current;
        // Use the larger of dx/dy (converted to ratio) so both axes feel natural
        const dx = e.nativeEvent.pageX - t.tx;
        const dy = e.nativeEvent.pageY - t.ty;
        // Drive by whichever axis moved more
        const driveDx = Math.abs(dx) >= Math.abs(dy * ratio);
        let nw: number, nh: number;
        if (driveDx) {
          nw = clamp(t.w - dx, MIN, t.x + t.w - b.x);
          nh = nw / ratio;
        } else {
          nh = clamp(t.h - dy, MIN, t.y + t.h - b.y);
          nw = nh * ratio;
        }
        // Clamp both to stay inside image
        nh = clamp(nh, MIN, t.y + t.h - b.y);
        nw = clamp(nh * ratio, MIN, t.x + t.w - b.x);
        nh = nw / ratio;
        // Ensure height doesn't fall below MIN
        if (nh < MIN) {
          nh = MIN;
          nw = nh * ratio;
        }
        onCropChangeRef.current({
          x: Math.max(b.x, t.x + t.w - nw),
          y: Math.max(b.y, t.y + t.h - nh),
          w: nw,
          h: nh,
        });
      },
    }),
  ).current;

  const HANDLE = 28;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: y,
          backgroundColor: "rgba(0,0,0,0.52)",
        }}
        pointerEvents="none"
      />
      <View
        style={{
          position: "absolute",
          top: y + h,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.52)",
        }}
        pointerEvents="none"
      />
      <View
        style={{
          position: "absolute",
          top: y,
          left: 0,
          width: x,
          height: h,
          backgroundColor: "rgba(0,0,0,0.52)",
        }}
        pointerEvents="none"
      />
      <View
        style={{
          position: "absolute",
          top: y,
          left: x + w,
          right: 0,
          height: h,
          backgroundColor: "rgba(0,0,0,0.52)",
        }}
        pointerEvents="none"
      />

      <View
        style={{ position: "absolute", top: y, left: x, width: w, height: h }}
        {...movePan.panHandlers}
      >
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            borderWidth: 1.5,
            borderColor: "#FFF",
          }}
          pointerEvents="none"
        />
        {[1 / 3, 2 / 3].map((f) => (
          <View
            key={`v${f}`}
            style={{
              position: "absolute",
              left: `${f * 100}%` as any,
              top: 0,
              bottom: 0,
              width: 0.6,
              backgroundColor: "rgba(255,255,255,0.35)",
            }}
            pointerEvents="none"
          />
        ))}
        {[1 / 3, 2 / 3].map((f) => (
          <View
            key={`h${f}`}
            style={{
              position: "absolute",
              top: `${f * 100}%` as any,
              left: 0,
              right: 0,
              height: 0.6,
              backgroundColor: "rgba(255,255,255,0.35)",
            }}
            pointerEvents="none"
          />
        ))}
        {(
          [
            { top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3 },
            { top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3 },
            { bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3 },
            {
              bottom: -2,
              right: -2,
              borderBottomWidth: 3,
              borderRightWidth: 3,
            },
          ] as any[]
        ).map((c, i) => (
          <View
            key={i}
            style={[
              {
                position: "absolute",
                width: 20,
                height: 20,
                borderColor: "#FFF",
              },
              c,
            ]}
            pointerEvents="none"
          />
        ))}
      </View>

      <View
        style={{
          position: "absolute",
          top: y - HANDLE / 2,
          left: x - HANDLE / 2,
          width: HANDLE * 2,
          height: HANDLE * 2,
          alignItems: "center",
          justifyContent: "center",
        }}
        {...tlPan.panHandlers}
      >
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: "#FFF",
            borderWidth: 2.5,
            borderColor: primaryColor,
          }}
        />
      </View>
      <View
        style={{
          position: "absolute",
          top: y + h - HANDLE / 2,
          left: x + w - HANDLE / 2,
          width: HANDLE * 2,
          height: HANDLE * 2,
          alignItems: "center",
          justifyContent: "center",
        }}
        {...brPan.panHandlers}
      >
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: primaryColor,
            borderWidth: 2.5,
            borderColor: "#FFF",
          }}
        />
      </View>
    </View>
  );
};

const RatioChipRow: React.FC<{
  cropMode: CropMode;
  onSelect: (m: CropMode) => void;
  rc: any;
  allowedModes?: CropMode[]; // ← new
}> = ({ cropMode, onSelect, rc, allowedModes }) => {
  const groups: Array<{ title: string; modes: CropMode[] }> = [
    { title: "Square", modes: [...(["square"] as const)] },
    { title: "Landscape", modes: [...(["l-4:3", "l-16:9"] as const)] },
    { title: "Portrait", modes: [...(["p-3:4", "p-9:16"] as const)] },
  ]
    // Filter out groups/modes not in allowedModes
    .map((group) => ({
      ...group,
      modes: allowedModes
        ? group.modes.filter((m) => allowedModes.includes(m))
        : group.modes,
    }))
    .filter((group) => group.modes.length > 0);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={rc.row}
    >
      {groups.map((group, gi) => (
        <React.Fragment key={group.title}>
          {gi > 0 && <View style={rc.divider} />}
          <View style={rc.groupWrap}>
            <View style={rc.chips}>
              {group.modes.map((m) => {
                const def = RATIO_DEFS.find((r) => r.mode === m)!;
                const on = cropMode === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[rc.chip, on && rc.chipOn]}
                    activeOpacity={0.75}
                    onPress={() => onSelect(m)}
                  >
                    <View
                      style={[
                        rc.icon,
                        on && rc.iconOn,
                        { width: def.iconW, height: def.iconH },
                      ]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </React.Fragment>
      ))}
    </ScrollView>
  );
};

const PickerRow: React.FC<{
  onCamera: () => void;
  onLibrary: () => void;
  pk: any;
  colors: any;
}> = ({ onCamera, onLibrary, pk, colors }) => (
  <View style={pk.row}>
    <TouchableOpacity style={pk.btn} onPress={onCamera} activeOpacity={0.8}>
      <Feather name="camera" size={28} color={colors.primary} />
      <Text style={pk.lbl}>Camera</Text>
    </TouchableOpacity>
    <View style={pk.div} />
    <TouchableOpacity style={pk.btn} onPress={onLibrary} activeOpacity={0.8}>
      <Feather name="image" size={28} color={colors.primary} />
      <Text style={pk.lbl}>Gallery</Text>
    </TouchableOpacity>
  </View>
);

type UploadPhase = "cropping" | "uploading" | "done";
const UploadOverlay: React.FC<{
  phase: UploadPhase;
  ov: any;
  successColor: string;
}> = ({ phase, ov, successColor }) => {
  const label =
    phase === "cropping"
      ? "Cropping image…"
      : phase === "uploading"
        ? "Uploading to cloud…"
        : "Done!";
  const icon =
    phase === "done" ? (
      <Feather name="check-circle" size={40} color={successColor} />
    ) : (
      <ActivityIndicator size="large" color="#FFF" />
    );
  return (
    <View style={ov.wrap}>
      {icon}
      <Text style={ov.txt}>{label}</Text>
      {phase === "uploading" && <Text style={ov.sub}>Please wait</Text>}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════════════════
export interface ImageEditorProps {
  imageUri?: string;
  uploadUrl: string;
  allowedCropModes?: CropMode[];
  onUploadSuccess?: (result: UploadResult) => void;
  onUploadError?: (message: string) => void;
  onClose?: () => void;
  token: string;
}
const ImageEditor: React.FC<ImageEditorProps> = ({
  imageUri,
  uploadUrl,
  allowedCropModes,
  token,
  onUploadSuccess,
  onUploadError,
  onClose,
}) => {
  const { zs, rc, pk, ov, s, colors } = useStyles();
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const TOP_H = 56;
  const PANEL_H = 60;
  // const STAT_H = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;
  const IMG_H = Math.max(200, H - TOP_H - PANEL_H - insets.top - insets.bottom);

  const [uri, setUri] = useState<string | null>(imageUri ?? null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [hasImage, setHasImage] = useState(!!imageUri);
  const [cropMode, setCropMode] = useState<CropMode>("square");
  const [zoom, setZoom] = useState(1);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase | null>(null);

  const isBusy = uploadPhase !== null;

  // Returns the rendered image rect inside the container (contain letterboxing)
  const getRenderedImageBounds = useCallback(
    (iw = imgSize.w, ih = imgSize.h) => computeImageBounds(iw, ih, W, IMG_H),
    [imgSize, W, IMG_H],
  );

  const defaultCropRect = useCallback(
    (iw = imgSize.w, ih = imgSize.h): CropRect => {
      const pad = 0.04;
      const b = getRenderedImageBounds(iw, ih);
      const ratio = ratioOf(cropMode); // use current ratio, not assumed 1:1
      const maxW = b.w * (1 - pad * 2);
      const maxH = b.h * (1 - pad * 2);
      // Fit the largest rect that satisfies the ratio within the padded bounds
      let rw = maxW;
      let rh = rw / ratio;
      if (rh > maxH) {
        rh = maxH;
        rw = rh * ratio;
      }
      return {
        x: b.x + (b.w - rw) / 2, // center horizontally
        y: b.y + (b.h - rh) / 2, // center vertically
        w: rw,
        h: rh,
      };
    },
    [getRenderedImageBounds, cropMode], // cropMode dep
  );

  const resetAll = useCallback(() => {
    setUri(null);
    setImgSize({ w: 0, h: 0 });
    setHasImage(false);
    setCropMode("square");
    setZoom(1);
    setUploadPhase(null);
    undos.current = [];
    redos.current = [];
  }, []);

  const handleClose = useCallback(() => {
    resetAll();
    onClose?.();
  }, [resetAll, onClose]);

  const [cropRect, setCropRect] = useState<CropRect>(defaultCropRect);

  useEffect(() => {
    if (!imgSize.w || !imgSize.h) return; // ← skip until image is loaded
    const ratio = ratioOf(cropMode);
    const b = computeImageBounds(imgSize.w, imgSize.h, W, IMG_H);
    setCropRect(computeCropRect(b, ratio));
  }, [cropMode, imgSize, W, IMG_H]);

  const applyZoomDelta = useCallback(
    (cur: number, next: number) => {
      const factor = cur / next;
      setCropRect((prev) => {
        const b = computeImageBounds(imgSize.w, imgSize.h, W, IMG_H);
        const ratio = ratioOf(cropMode);
        const cx = prev.x + prev.w / 2;
        const cy = prev.y + prev.h / 2;
        let nw = Math.max(60, prev.w * factor);
        let nh = nw / ratio;
        if (nh > b.h) {
          nh = b.h;
          nw = nh * ratio;
        }
        if (nw > b.w) {
          nw = b.w;
          nh = nw / ratio;
        }
        return {
          x: clamp(cx - nw / 2, b.x, b.x + b.w - nw),
          y: clamp(cy - nh / 2, b.y, b.y + b.h - nh),
          w: nw,
          h: nh,
        };
      });
    },
    [cropMode, imgSize, W, IMG_H], // imgSize added, no getRenderedImageBounds
  );

  const handleZoomIn = useCallback(
    () =>
      setZoom((p) => {
        const n = Math.min(ZOOM_MAX, parseFloat((p + ZOOM_STEP).toFixed(2)));
        applyZoomDelta(p, n);
        return n;
      }),
    [applyZoomDelta],
  );
  const handleZoomOut = useCallback(
    () =>
      setZoom((p) => {
        const n = Math.max(ZOOM_MIN, parseFloat((p - ZOOM_STEP).toFixed(2)));
        applyZoomDelta(p, n);
        return n;
      }),
    [applyZoomDelta],
  );

  type Snap = { cropMode: CropMode; cropRect: CropRect; zoom: number };
  const undos = useRef<Snap[]>([]);
  const redos = useRef<Snap[]>([]);
  const snap = useCallback(
    (): Snap => ({ cropMode, cropRect: { ...cropRect }, zoom }),
    [cropMode, cropRect, zoom],
  );
  const pushUndo = useCallback(() => {
    undos.current = [...undos.current, snap()];
    redos.current = [];
  }, [snap]);
  const undo = useCallback(() => {
    if (!undos.current.length) return;
    redos.current = [...redos.current, snap()];
    const p = undos.current.pop()!;
    setCropMode(p.cropMode);
    setCropRect(p.cropRect);
    setZoom(p.zoom);
  }, [snap]);
  const redo = useCallback(() => {
    if (!redos.current.length) return;
    undos.current = [...undos.current, snap()];
    const n = redos.current.pop()!;
    setCropMode(n.cropMode);
    setCropRect(n.cropRect);
    setZoom(n.zoom);
  }, [snap]);

  const canUndo = undos.current.length > 0;
  const canRedo = redos.current.length > 0;

  const resetEdits = useCallback(
    (newUri: string, asset: { width: number; height: number }) => {
      undos.current = [];
      redos.current = [];
      const b = computeImageBounds(asset.width, asset.height, W, IMG_H);
      const rect = computeCropRect(b, 1); // square = ratio 1
      // Set all state together — no RAF needed
      setUri(newUri);
      setImgSize({ w: asset.width, h: asset.height });
      setHasImage(true);
      setCropMode("square");
      setCropRect(rect);
      setZoom(1);
    },
    [W, IMG_H],
  );

  const pickFromLibrary = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: false,
      exif: false,
    });
    if (!result.canceled && result.assets[0])
      resetEdits(result.assets[0].uri, result.assets[0]);
  }, [resetEdits]);

  const pickFromCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow camera access.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: false,
      exif: false,
    });
    if (!result.canceled && result.assets[0])
      resetEdits(result.assets[0].uri, result.assets[0]);
  }, [resetEdits]);

  const screenCropToImageCrop = useCallback(() => {
    if (!imgSize.w || !imgSize.h) return null;
    // "contain" uses the smaller scale factor
    const scale = Math.min(W / imgSize.w, IMG_H / imgSize.h);
    const offX = (W - imgSize.w * scale) / 2;
    const offY = (IMG_H - imgSize.h * scale) / 2;
    const originX = clamp(
      Math.round((cropRect.x - offX) / scale),
      0,
      imgSize.w - 1,
    );
    const originY = clamp(
      Math.round((cropRect.y - offY) / scale),
      0,
      imgSize.h - 1,
    );
    const width = clamp(Math.round(cropRect.w / scale), 1, imgSize.w - originX);
    const height = clamp(
      Math.round(cropRect.h / scale),
      1,
      imgSize.h - originY,
    );
    if (width <= 0 || height <= 0) return null;
    return { originX, originY, width, height };
  }, [imgSize, W, IMG_H, cropRect]);

  const handleSave = useCallback(async () => {
    if (!uri || isBusy) return;
    try {
      setUploadPhase("cropping");
      const actions: ImageManipulator.Action[] = [];
      const imageCrop = screenCropToImageCrop();
      if (imageCrop) actions.push({ crop: imageCrop });

      const srcW = imageCrop?.width ?? imgSize.w;
      const srcH = imageCrop?.height ?? imgSize.h;
      const MAX = 2048;
      if (srcW > MAX || srcH > MAX) {
        actions.push(
          srcW >= srcH
            ? { resize: { width: MAX } }
            : { resize: { height: MAX } },
        );
      }

      const cropped = await ImageManipulator.manipulateAsync(uri, actions, {
        compress: DEFAULT_QUALITY / 100,
        format: ImageManipulator.SaveFormat.WEBP,
        base64: false,
      });

      setUploadPhase("uploading");
      const filename = `image_${Date.now()}.webp`;
      const cloudUrl = await uploadImageToCloud(
        cropped.uri,
        uploadUrl,
        token,
        filename,
      );

      setUploadPhase("done");
      const result: UploadResult = {
        cloudUrl,
        width: cropped.width,
        height: cropped.height,
      };

      setTimeout(() => {
        onUploadSuccess?.(result);
        resetAll();
        onClose?.();
      }, 600);
    } catch (err: any) {
      setUploadPhase(null);
      const msg = err?.message ?? String(err);
      onUploadError?.(msg);
      Alert.alert("Save failed", msg);
    }
  }, [
    uri,
    isBusy,
    screenCropToImageCrop,
    imgSize,
    uploadUrl,
    onUploadSuccess,
    onUploadError,
    resetAll,
    onClose,
  ]);

  if (!hasImage) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          paddingTop: insets.top,
        }}
      >
        <StatusBar
          barStyle={
            colors.background === "#0F172A" ? "light-content" : "dark-content"
          }
          backgroundColor={colors.background}
        />
        <View style={[s.topBar, { height: TOP_H }]}>
          <TouchableOpacity
            onPress={handleClose}
            activeOpacity={0.7}
            style={[s.iconBtn, { backgroundColor: colors.surfaceVariant }]}
          >
            <Feather name="x" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[s.topTitle, { color: colors.text }]}>
            Crop & Upload
          </Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.emptyBody}>
          <View style={s.emptyIcon}>
            <Feather name="image" size={48} color={colors.borderStrong} />
          </View>
          <Text style={s.emptyTitle}>No image selected</Text>
          <Text style={s.emptyHint}>Choose a photo to start cropping</Text>
          <PickerRow
            onCamera={pickFromCamera}
            onLibrary={pickFromLibrary}
            pk={pk}
            colors={colors}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#111", paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />
      {uploadPhase && (
        <UploadOverlay
          phase={uploadPhase}
          ov={ov}
          successColor={colors.success}
        />
      )}

      <View
        style={[
          s.topBar,
          { height: TOP_H, backgroundColor: "#111", zIndex: 100 },
        ]}
      >
        <TouchableOpacity
          onPress={handleClose}
          activeOpacity={0.7}
          style={s.iconBtn}
          disabled={isBusy}
        >
          <Feather name="x" size={18} color="#FFF" />
        </TouchableOpacity>

        <View style={s.undoRow}>
          <TouchableOpacity
            onPress={undo}
            disabled={!canUndo || isBusy}
            activeOpacity={0.7}
            style={[s.undoBtn, (!canUndo || isBusy) && { opacity: 0.3 }]}
          >
            <Feather name="corner-up-left" size={18} color="#FFF" />
          </TouchableOpacity>
          <Text style={s.topTitle}>Crop & Upload</Text>
          <TouchableOpacity
            onPress={redo}
            disabled={!canRedo || isBusy}
            activeOpacity={0.7}
            style={[s.undoBtn, (!canRedo || isBusy) && { opacity: 0.3 }]}
          >
            <Feather name="corner-up-right" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isBusy}
          activeOpacity={0.7}
          style={[s.saveBtn, isBusy && { opacity: 0.5 }]}
        >
          <Feather name="upload-cloud" size={17} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View
        style={{
          width: W,
          height: IMG_H,
          backgroundColor: "#000",
          overflow: "hidden",
        }}
      >
        {uri && (
          <Image
            key={uri}
            source={{ uri }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
            onLoad={(e) => {
              const src = (e.nativeEvent as any).source ?? e.nativeEvent;
              if (src?.width > 0 && src?.height > 0 && imgSize.w === 0) {
                setImgSize({ w: src.width, h: src.height });
                // cropMode effect will fire and compute the correct rect
              }
            }}
          />
        )}
        {uri && (
          <CropOverlay
            containerW={W}
            containerH={IMG_H}
            cropMode={cropMode}
            cropRect={cropRect}
            onCropChange={setCropRect}
            primaryColor={colors.primary}
            imageBounds={getRenderedImageBounds()}
          />
        )}
        <ZoomControls
          zoom={zoom}
          onZoomIn={() => {
            pushUndo();
            handleZoomIn();
          }}
          onZoomOut={() => {
            pushUndo();
            handleZoomOut();
          }}
          zs={zs}
        />
      </View>

      <View style={s.panel}>
        <RatioChipRow
          cropMode={cropMode}
          onSelect={(m) => {
            pushUndo();
            setCropMode(m);
          }}
          rc={rc}
          allowedModes={allowedCropModes}
        />
      </View>
    </View>
  );
};

export default ImageEditor;
