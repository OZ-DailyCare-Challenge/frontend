"use client";

import { useEffect, useState } from "react";
import { Search, Trash2, UserPlus, X } from "lucide-react";
import {
  deleteFriend,
  getFriends,
  searchUsers,
  sendFriendRequest,
  type Friend,
  type UserSearchResult,
} from "@/src/api/social";
import ProfileNameAvatar from "@/src/components/ProfileNameAvatar";

type Props = {
  open: boolean;
  onClose: () => void;
};

type FriendTab = "search" | "friends";

export default function FriendAddModal({ open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<FriendTab>("search");
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [requestedIds, setRequestedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    void loadFriends();

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (open) return;

    setActiveTab("search");
    setKeyword("");
    setResults([]);
    setRequestedIds(new Set());
    setFriends([]);
    setMessage("");
    setLoading(false);
    setFriendsLoading(false);
  }, [open]);

  if (!open) return null;

  const showMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2200);
  };

  const handleSearch = async () => {
    const query = keyword.trim();
    if (!query) return;

    try {
      setLoading(true);
      const users = await searchUsers(query);
      setResults(users);
      setRequestedIds(
        new Set(users.filter((user) => user.is_requested).map((user) => user.id))
      );
      if (users.length === 0) showMessage("검색 결과가 없어요.");
    } catch {
      showMessage("친구 검색에 실패했어요.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId: number) => {
    try {
      await sendFriendRequest(userId);
      setRequestedIds((prev) => new Set(prev).add(userId));
      showMessage("친구 요청을 보냈어요.");
    } catch {
      setRequestedIds((prev) => new Set(prev).add(userId));
      showMessage("이미 친구이거나 진행 중인 요청이 있어요.");
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
    const confirmed = window.confirm("친구를 삭제할까요?");
    if (!confirmed) return;

    try {
      await deleteFriend(friendId);
      showMessage("친구를 삭제했어요.");
      await loadFriends();
    } catch {
      showMessage("친구 삭제에 실패했어요.");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#163126]/28 px-4 py-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <section className="relative z-10 flex max-h-[86vh] w-full max-w-xl flex-col overflow-hidden rounded-[28px] border border-[#163126]/10 bg-white shadow-[0_28px_90px_rgba(22,49,38,0.22)]">
        <div className="flex items-center justify-between gap-4 border-b border-[#163126]/8 px-5 py-5">
          <div>
            <h2 className="text-lg font-bold text-[#163126]">친구 추가</h2>
            <p className="mt-1 text-sm text-[#163126]/55">
              친구를 찾거나 현재 친구 목록을 확인해보세요.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#163126]/10 text-[#163126] transition hover:bg-[#f6faf7]"
            aria-label="친구 추가 닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-[#163126]/8 px-5 pt-4">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#f4faf6] p-1">
            {[
              { key: "search", label: "친구 찾기" },
              {
                key: "friends",
                label: `친구 목록${friends.length ? ` ${friends.length}` : ""}`,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as FriendTab)}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                  activeTab === tab.key
                    ? "bg-white text-[#163126] shadow-sm"
                    : "text-[#163126]/55 hover:text-[#163126]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "search" && (
            <div className="flex gap-3 py-4">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#163126]/35"
                />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void handleSearch();
                  }}
                  placeholder="친구 닉네임 검색"
                  className="h-12 w-full rounded-2xl border border-[#163126]/10 bg-[#fbfdfb] pl-11 pr-4 text-sm text-[#163126] outline-none transition focus:border-[#2E7D5B]/50 focus:bg-white"
                />
              </div>

              <button
                type="button"
                onClick={() => void handleSearch()}
                disabled={loading}
                className="rounded-full bg-[#163126] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4232] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "검색 중" : "검색"}
              </button>
            </div>
          )}

          {activeTab === "friends" && (
            <button
              type="button"
              onClick={() => void loadFriends()}
              disabled={friendsLoading}
              className="my-4 rounded-full border border-[#dce9e0] bg-white px-4 py-2 text-xs font-bold text-[#2E7D5B] transition hover:bg-[#f4fbf6] disabled:opacity-60"
            >
              {friendsLoading ? "새로고침 중" : "친구 목록 새로고침"}
            </button>
          )}

          {message && (
            <p className="mb-4 rounded-2xl bg-[#f4faf6] px-4 py-3 text-sm font-semibold text-[#2E7D5B]">
              {message}
            </p>
          )}
        </div>

        <div className="min-h-[260px] overflow-auto px-5 py-5">
          {activeTab === "search" ? (
            results.length === 0 ? (
              <EmptyState
                title="친구를 검색해보세요"
                description="검색 결과에서 바로 친구 요청을 보낼 수 있어요."
              />
            ) : (
              <div className="space-y-3">
                {results.map((user) => {
                  const requested = requestedIds.has(user.id);

                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-3 rounded-[22px] border border-[#163126]/8 bg-[#fbfdfb] px-4 py-3"
                    >
                      <FriendAvatar
                        name={user.nickname}
                        image={user.profile_image}
                        description={`캐릭터 ${user.character_stage}단계`}
                      />

                      {user.is_friend ? (
                        <span className="shrink-0 rounded-full bg-[#ecf9f1] px-3 py-2 text-xs font-semibold text-[#2E7D5B]">
                          친구
                        </span>
                      ) : requested ? (
                        <span className="shrink-0 rounded-full border border-[#163126]/10 bg-white px-3 py-2 text-xs font-semibold text-[#163126]/50">
                          요청됨
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleSendRequest(user.id)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#163126]/10 bg-white px-3 py-2 text-xs font-semibold text-[#163126] transition hover:bg-[#f4fbf6]"
                        >
                          <UserPlus size={14} />
                          추가
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : friendsLoading && friends.length === 0 ? (
            <EmptyState title="친구 목록을 불러오는 중이에요" />
          ) : friends.length === 0 ? (
            <EmptyState
              title="아직 친구가 없어요"
              description="친구를 추가하면 함께 챌린지를 이어갈 수 있어요."
            />
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.friend_id}
                  className="flex items-center justify-between gap-3 rounded-[22px] border border-[#163126]/8 bg-[#fbfdfb] px-4 py-3"
                >
                  <FriendAvatar
                    name={friend.nickname}
                    image={friend.profile_image}
                    description={`캐릭터 ${friend.character_stage}단계`}
                  />

                  <button
                    type="button"
                    onClick={() => void handleDeleteFriend(friend.friend_id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#163126]/10 bg-white text-[#163126]/60 transition hover:bg-[#f6faf7]"
                    aria-label="친구 삭제"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function FriendAvatar({
  name,
  image,
  description,
}: {
  name: string;
  image?: string | null;
  description: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <ProfileNameAvatar
        name={name}
        image={image}
        className="h-11 w-11"
        textClassName="text-[10px]"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-[#163126]">{name}</p>
        <p className="mt-1 text-xs text-[#163126]/45">{description}</p>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[24px] bg-[#f8fbf8] px-5 text-center">
      <img
        src="/images/buddy-friend.png"
        alt=""
        className="h-28 w-28 object-contain"
      />
      <p className="mt-3 text-sm font-bold text-[#163126]">{title}</p>
      {description && (
        <p className="mt-2 text-xs leading-5 text-[#163126]/50">
          {description}
        </p>
      )}
    </div>
  );
}
