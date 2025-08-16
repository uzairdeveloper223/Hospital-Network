// ImgBB API configuration for image uploads
import axios from "axios"

const IMGBB_API_KEY = "a1deed7e7b58edf34021f788161121f4"
const IMGBB_UPLOAD_URL = "https://api.imgbb.com/1/upload"

export const uploadImageToImgBB = async (imageFile) => {
  try {
    const formData = new FormData()
    formData.append("image", imageFile)
    formData.append("key", IMGBB_API_KEY)

    const response = await axios.post(IMGBB_UPLOAD_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    if (response.data.success) {
      return {
        success: true,
        url: response.data.data.url,
        deleteUrl: response.data.data.delete_url,
      }
    } else {
      throw new Error("Failed to upload image")
    }
  } catch (error) {
    console.error("Error uploading image:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}
