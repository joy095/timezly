import { UploadResult } from "@/components/ImageEditor";
import ImageUploader from "@/components/ImageUploader";
import { AppContainer } from "@/components/ui";
import { Text } from "react-native";

export default function UploadImageScreen() {
  const handleUploadComplete = (result: UploadResult) => {
    if (typeof result.cloudUrl !== "string") {
      console.error("cloudUrl is not a string:", result.cloudUrl);
      return;
    }
  };

  return (
    <AppContainer>
      <Text>Upload image screen</Text>
      <ImageUploader
        uploadUrl={`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/user/image`}
        allowedCropModes={["square"]}
        onUploadComplete={handleUploadComplete}
        buttonTitle="Upload"
      />
    </AppContainer>
  );
}
