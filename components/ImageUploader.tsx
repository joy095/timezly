// components/ImageUploader.tsx
import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import useAppColors from "@/theme/useAppColors";
import ImageEditor, { ImageEditorProps, UploadResult } from "./ImageEditor";

interface ImageUploaderProps {
  uploadUrl: string;
  onUploadComplete: (result: UploadResult) => void;
  buttonTitle?: string;
  allowedCropModes?: ImageEditorProps["allowedCropModes"];
  token: string;
}

export default function ImageUploader({
  uploadUrl,
  onUploadComplete,
  buttonTitle = "Upload",
  allowedCropModes,
  token,
}: ImageUploaderProps) {
  const colors = useAppColors();
  const [selectedUri, setSelectedUri] = useState<string | null>(null);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow access to your photo library to select an image.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: false,
      exif: false,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedUri(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePickImage}
        style={[styles.button, { backgroundColor: colors.surface }]}
      >
        <Feather name="image" size={14} color={colors.primary} />
        <Text style={[styles.buttonText, { color: colors.text }]}>
          {buttonTitle}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={!!selectedUri}
        animationType="slide"
        onRequestClose={() => setSelectedUri(null)}
      >
        {selectedUri && (
          <ImageEditor
            imageUri={selectedUri}
            uploadUrl={uploadUrl}
            allowedCropModes={allowedCropModes}
            onClose={() => setSelectedUri(null)}
            token={token}
            onUploadSuccess={(result) => {
              setSelectedUri(null);
              onUploadComplete(result);
            }}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 20,
    gap: 6,
    // Shadow for floating effect
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 14,
  },
});
