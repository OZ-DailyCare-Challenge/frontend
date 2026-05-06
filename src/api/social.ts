import { storage } from "@/src/utils/storage";

export type UserSearchResult = {
  id: number;
  nickname: string;
  profile_image?: string | null;
  character_stage: number;
  is_friend: boolean;
  is_requested: boolean;
};

export type FriendRequest = {
  id: number;
  requester_id: number;
  requester_nickname: string;
  requester_profile_image?: string | null;
  created_at: string;
};

export type FriendRequestSentResponse = {
  request_id: number;
  message: string;
};

export type Friend = {
  friend_id: number;
  nickname: string;
  profile_image?: string | null;
  character_stage: number;
  created_at: string;
};

export type FeedItem = {
  challenge_id: number;
  user_challenge_id: number;
  challenge_log_id?: number | null;
  user_id: number;
  nickname: string;
  profile_image?: string | null;
  challenge_title: string;
  log_date?: string | null;
  current_streak: number;
  created_at: string;
  certified_today: boolean;
};

export type FeedNotification = {
  id: number;
  sender_id: number;
  sender_nickname: string;
  sender_profile_image?: string | null;
  challenge_log_id?: number | null;
  challenge_title?: string | null;
  message: string;
  read_at?: string | null;
  created_at: string;
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

export async function searchUsers(nickname: string): Promise<UserSearchResult[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/social/users/search?nickname=${encodeURIComponent(nickname)}`,
    { method: "GET", headers: getAuthHeaders() }
  );
  if (!response.ok) await parseErrorResponse(response, "사용자 검색 실패");
  const data = await response.json();
  return data.users ?? [];
}

export async function sendFriendRequest(
  receiverId: number
): Promise<FriendRequestSentResponse> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/social/friends/request/${receiverId}`,
    { method: "POST", headers: getAuthHeaders() }
  );

  if (!response.ok) await parseErrorResponse(response, "친구 요청 실패");

  return response.json();
}

export async function getFriendRequests(): Promise<FriendRequest[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/social/friends/requests`,
    { method: "GET", headers: getAuthHeaders() }
  );
  if (!response.ok) await parseErrorResponse(response, "친구 요청 목록 조회 실패");
  const data = await response.json();
  return data.requests ?? [];
}

export async function acceptFriendRequest(requestId: number): Promise<void> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/social/friends/requests/${requestId}/accept`,
    { method: "PATCH", headers: getAuthHeaders() }
  );
  if (!response.ok) await parseErrorResponse(response, "친구 요청 수락 실패");
}

export async function rejectFriendRequest(requestId: number): Promise<void> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/social/friends/requests/${requestId}/reject`,
    { method: "PATCH", headers: getAuthHeaders() }
  );
  if (!response.ok) await parseErrorResponse(response, "친구 요청 거절 실패");
}

export async function getFriends(): Promise<Friend[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/social/friends`,
    { method: "GET", headers: getAuthHeaders() }
  );
  if (!response.ok) await parseErrorResponse(response, "친구 목록 조회 실패");
  const data = await response.json();
  return data.friends ?? [];
}

export async function getFeed(): Promise<FeedItem[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/social/feed`,
    { method: "GET", headers: getAuthHeaders() }
  );
  if (!response.ok) await parseErrorResponse(response, "피드 조회 실패");
  const data = await response.json();
  return data.items ?? [];
}

export async function sendFeedCheer(
  targetUserId: number,
  challengeLogId?: number | null
): Promise<{ message?: string; notification_id?: number | null }> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/social/feed/cheer`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      target_user_id: targetUserId,
      challenge_log_id: challengeLogId ?? null,
    }),
  });

  if (!response.ok) await parseErrorResponse(response, "응원 보내기 실패");

  return response.json();
}

export async function getFeedNotifications(): Promise<FeedNotification[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/social/feed/notifications`,
    { method: "GET", headers: getAuthHeaders() }
  );
  if (!response.ok) await parseErrorResponse(response, "피드 응원 알림 조회 실패");
  const data = await response.json();
  return data.notifications ?? [];
}

export async function deleteFriend(friendId: number): Promise<void> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/social/friends/${friendId}`,
    { method: "DELETE", headers: getAuthHeaders() }
  );
  if (!response.ok) await parseErrorResponse(response, "친구 삭제 실패");
}
