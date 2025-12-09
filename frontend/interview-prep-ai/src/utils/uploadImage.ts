import { API_PATHS } from "./apiPaths";
import axiosInstance from "./axiosInstance";

interface UploadResponse {
  imageUrl: string;
}

const uploadImage = async (imageFile: File): Promise<UploadResponse> => {
  const formData = new FormData();
  // Append image file to form data
  formData.append("image", imageFile);

  try {
    const response = await axiosInstance.post<UploadResponse>(
      API_PATHS.IMAGE.UPLOAD_IMAGE,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data", // Set header for file upload
        },
      }
    );
    return response.data; // Return response data
  } catch (error) {
    throw error;
  }
};

export default uploadImage;
