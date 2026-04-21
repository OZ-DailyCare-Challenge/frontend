import { storage } from "@/src/utils/storage";

export type UserSearchResult = {
  id: number;
  nickname: string;
  profile_image?: string | null;
};

export type FriendRequest = {
  id: number;
  requester_id: number;
  receiver_id: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "BLOCKED";
  requester: UserSearchResult;
};

export type Friend = {
  id: number;
  user_id: number;
  friend_id: number;
  friend: UserSearchResult;
};

function getApiBaseUrl() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) throw new Error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았습니다.");
  return apiBaseUrl;
}

function getAuthHeaders() {
  const accessToken = storage.getAccessToken();
  if (!accessToken) throw new Error("액세스 토큰이 없습니다.");
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

async function parseErrorResponse(response: Response, defaultMessage: string): Promise<never> {
  const errorText = await response.text().catch(() => "");
  throw new Error(`${defaultMessage}: ${response.status} ${errorText}`);
}

/**
 * 닉네임으로 사용자 검색
 * GET /api/v1/social/users/search?nickname=...
 */
export async function searchUsers(nickname: string): Promise<UserSearchResult[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/social/users/search?nickname=${encodeURIComponent(nickname)}`,
    { method: "GET", headers: getAuthHeaders() }
  );
  if (!response.ok) await parseErrorResponse(response, "사용자 검색 실패");
  return response.json();
}

/**
 * 친구 요청 전송
 * POST /api/v1/social/friends/request/{receiver_id}
 */
export async function sendFriendRequest(receiverId: number): Promise<void> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/social/friends/request/${receiverId}`,
    { method: "POST", headers: getAuthHeaders() }
  );
  if (!response.ok) await parseErrorResponse(response, "친구 요청 실패");
}

/**
 * 받은 친구 요청 목록 조회
 * GET /api/v1/social/friends/requests
 */
export async function getFriendRequests(): Promise<FriendRequest[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/social/friends/requests`,
    { method: "GET", headers: getAuthHeaders() }
  );
  if (!response.ok) await parseErrorResponse(response, "친구 요청 목록 조회 실패");
  return response.json();
}

/**
 * 친구 요청 수락
 * PATCH /api/v1/social/friends/requests/{request_id}/accept
 */
export async function acceptFriendRequest(requestId: number): Promise<void> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/social/friends/requests/${requestId}/accept`,
    { method: "PATCH", headers: getAuthHeaders() }
  );
  if (!response.ok) await parseErrorResponse(response, "친구 요청 수락 실패");
}

/**
 * 친구 요청 거절
 * PATCH /api/v1/social/friends/requests/{request_id}/reject
 */
export async function rejectFriendRequest(requestId: number): Promise<void> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/social/friends/requests/${requestId}/reject`,
    { method: "PATCH", headers: getAuthHeaders() }
  );
  if (!response.ok) await parseErrorResponse(response, "친구 요청 거절 실패");
}

/**
 * 친구 목록 조회
 * GET /api/v1/social/friends
 */
export async function getFriends(): Promise<Friend[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/social/friends`,
    { method: "GET", headers: getAuthHeaders() }
  );
  if (!response.ok) await parseErrorResponse(response, "친구 목록 조회 실패");
  return response.json();
}

/**
 * 친구 삭제
 * DELETE /api/v1/social/friends/{friend_id}
 */
export async function deleteFriend(friendId: number): Promise<void> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/social/friends/${friendId}`,
    { method: "DELETE", headers: getAuthHeaders() }
  );
  if (!response.ok) await parseErrorResponse(response, "친구 삭제 실패");
}
