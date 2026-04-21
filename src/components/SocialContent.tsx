"use client";

import { useState, useEffect } from "react";
import {
  searchUsers,
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  deleteFriend,
  type UserSearchResult,
  type FriendRequest,
  type Friend,
} from "@/src/api/social";

type Tab = "search" | "requests" | "friends";

export default function SocialContent() {
  const [activeTab, setActiveTab] = useState<Tab>("friends");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

  const [message, setMessage] = useState("");

  useEffect(() => {
    if (activeTab === "requests") loadFriendRequests();
    if (activeTab === "friends") loadFriends();
  }, [activeTab]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2500);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setSearchLoading(true);
      const results = await searchUsers(searchQuery.trim());
      setSearchResults(results);
    } catch {
      showMessage("검색에 실패했어요.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendRequest = async (userId: number) => {
    try {
      await sendFriendRequest(userId);
      showMessage("친구 요청을 보냈어요.");
    } catch {
      showMessage("친구 요청에 실패했어요.");
    }
  };

  const loadFriendRequests = async () => {
    try {
      setRequestsLoading(true);
      const data = await getFriendRequests();
      setFriendRequests(data);
    } catch {
      showMessage("친구 요청 목록을 불러오지 못했어요.");
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleAccept = async (requestId: number) => {
    try {
      await acceptFriendRequest(requestId);
      showMessage("친구 요청을 수락했어요.");
      loadFriendRequests();
    } catch {
      showMessage("수락에 실패했어요.");
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await rejectFriendRequest(requestId);
      showMessage("친구 요청을 거절했어요.");
      loadFriendRequests();
    } catch {
      showMessage("거절에 실패했어요.");
    }
  };

  const loadFriends = async () => {
    try {
      setFriendsLoading(true);
      const data = await getFriends();
      setFriends(data);
    } catch {
      showMessage("친구 목록을 불러오지 못했어요.");
    } finally {
      setFriendsLoading(false);
    }
  };

  const handleDeleteFriend = async (friendId: number) => {
    if (!window.confirm("친구를 삭제할까요?")) return;
    try {
      await deleteFriend(friendId);
      showMessage("친구를 삭제했어요.");
      loadFriends();
    } catch {
      showMessage("친구 삭제에 실패했어요.");
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "friends", label: "친구 목록" },
    { key: "requests", label: "받은 요청" },
    { key: "search", label: "친구 찾기" },
  ];

  return (
    <div className="mx-auto max-w-xl">
      {message && (
        <div className="mb-4 rounded-2xl bg-[#2E7D5B]/10 px-4 py-3 text-sm text-[#2E7D5B]">
          {message}
        </div>
      )}

      {/* 탭 */}
      <div className="mb-6 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-[#2E7D5B] text-white"
                : "bg-white text-[#163126]/60 border border-[#e7efe9]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 친구 찾기 */}
      {activeTab === "search" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="닉네임으로 검색"
              className="flex-1 rounded-2xl border border-[#e7efe9] bg-white px-4 py-3 text-sm outline-none focus:border-[#2E7D5B]"
            />
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              className="rounded-2xl bg-[#2E7D5B] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#256349] disabled:opacity-60"
            >
              {searchLoading ? "검색 중..." : "검색"}
            </button>
          </div>

          <div className="space-y-2">
            {searchResults.length === 0 && !searchLoading && searchQuery && (
              <p className="py-6 text-center text-sm text-[#163126]/40">검색 결과가 없어요.</p>
            )}
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-2xl border border-[#e7efe9] bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#e7efe9] overflow-hidden">
                    {user.profile_image ? (
                      <img src={user.profile_image} alt={user.nickname} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-[#2E7D5B]">
                        {user.nickname[0]}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-[#163126]">{user.nickname}</span>
                </div>
                <button
                  onClick={() => handleSendRequest(user.id)}
                  className="rounded-full bg-[#2E7D5B]/10 px-3 py-1.5 text-xs font-medium text-[#2E7D5B] transition hover:bg-[#2E7D5B]/20"
                >
                  친구 요청
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 받은 요청 */}
      {activeTab === "requests" && (
        <div className="space-y-2">
          {requestsLoading && (
            <p className="py-6 text-center text-sm text-[#163126]/40">불러오는 중...</p>
          )}
          {!requestsLoading && friendRequests.length === 0 && (
            <p className="py-6 text-center text-sm text-[#163126]/40">받은 친구 요청이 없어요.</p>
          )}
          {friendRequests.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between rounded-2xl border border-[#e7efe9] bg-white px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#e7efe9] overflow-hidden">
                  {req.requester_profile_image ? (
                    <img src={req.requester_profile_image} alt={req.requester_nickname} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-[#2E7D5B]">
                      {req.requester_nickname[0]}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-[#163126]">{req.requester_nickname}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(req.id)}
                  className="rounded-full bg-[#2E7D5B] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#256349]"
                >
                  수락
                </button>
                <button
                  onClick={() => handleReject(req.id)}
                  className="rounded-full border border-[#e7efe9] px-3 py-1.5 text-xs font-medium text-[#163126]/60 transition hover:bg-[#f7faf8]"
                >
                  거절
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 친구 목록 */}
      {activeTab === "friends" && (
        <div className="space-y-2">
          {friendsLoading && (
            <p className="py-6 text-center text-sm text-[#163126]/40">불러오는 중...</p>
          )}
          {!friendsLoading && friends.length === 0 && (
            <p className="py-6 text-center text-sm text-[#163126]/40">아직 친구가 없어요. 친구를 찾아보세요!</p>
          )}
          {friends.map((friend) => (
            <div
              key={friend.friend_id}
              className="flex items-center justify-between rounded-2xl border border-[#e7efe9] bg-white px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#e7efe9] overflow-hidden">
                  {friend.profile_image ? (
                    <img src={friend.profile_image} alt={friend.nickname} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-[#2E7D5B]">
                      {friend.nickname[0]}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-[#163126]">{friend.nickname}</span>
              </div>
              <button
                onClick={() => handleDeleteFriend(friend.friend_id)}
                className="rounded-full border border-[#e7efe9] px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-50"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
