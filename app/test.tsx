import React, { useState } from "react";
import { View, StyleSheet, Image, Text } from "react-native";
import ImageUploader from "@/components/ImageUploader";
import { UploadResult } from "@/components/ImageEditor";
import useAppColors from "@/theme/useAppColors";
import { BACKEND_URL } from "@/const";

export default function TestScreen() {
  const colors = useAppColors();
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleUploadComplete = (result: UploadResult) => {
    // This fires after the image is successfully cropped and uploaded to your server
    console.log("Upload Success!", result);
    setUploadedUrl(result.cloudUrl);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Drop the ImageUploader anywhere you need image picking + cropping! 
        Just pass your API endpoint and a completion handler.
      */}
      <ImageUploader
        uploadUrl={`${BACKEND_URL}/api/user/image`}
        onUploadComplete={handleUploadComplete}
        buttonTitle="Upload Profile Picture"
      />

      {/* Display the result for testing purposes */}
      {uploadedUrl && (
        <View style={styles.resultContainer}>
          <Text style={[styles.resultText, { color: colors.text }]}>
            Upload Successful!
          </Text>
          <Image
            source={{ uri: uploadedUrl }}
            style={[styles.previewImage, { borderColor: colors.border }]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  resultContainer: {
    marginTop: 32,
    alignItems: "center",
  },
  resultText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  previewImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
  },
});
