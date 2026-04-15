import { storage } from "@/src/utils/storage";

function getApiBaseUrl() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았습니다.");
  }

  return apiBaseUrl;
}

function getAuthHeaders() {
  const accessToken = storage.getAccessToken();

  if (!accessToken) {
    throw new Error("액세스 토큰이 없습니다.");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function parseErrorResponse(
  response: Response,
  defaultMessage: string
): Promise<never> {
  const errorText = await response.text().catch(() => "");
  throw new Error(`${defaultMessage}: ${response.status} ${errorText}`);
}

export type UploadImageResponse = {
  url?: string;
  image_url?: string;
  file_url?: string;
  data?: {
    url?: string;
    image_url?: string;
    file_url?: string;
  };
};

export async function uploadProfileImage(
  file: File
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${getApiBaseUrl()}/api/v1/uploads/profile-image`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    await parseErrorResponse(response, "프로필 이미지 업로드 실패");
  }

  const result: UploadImageResponse = await response.json();

  const url =
    result.url ??
    result.image_url ??
    result.file_url ??
    result.data?.url ??
    result.data?.image_url ??
    result.data?.file_url;

  if (!url) {
    throw new Error("업로드 응답에 이미지 URL이 없습니다.");
  }

  return { url };
}