"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, RefreshCw, X } from "lucide-react";
import {
  acceptFriendRequest,
  getFeedNotifications,
  getFriendRequests,
  rejectFriendRequest,
  type FeedNotification,
  type FriendRequest,
} from "@/src/api/social";
import ProfileNameAvatar from "@/src/components/ProfileNameAvatar";

type Props = {
  open: boolean;
  onClose: () => void;
  onChanged?: (count: number) => void;
  onCheerChanged?: (count: number) => void;
};

type ActiveTab = "requests" | "cheers";

export const CHEER_NOTIFICATION_READ_KEY = "social-feed-notification-read-ids";

export default function FriendRequestModal({
  open,
  onClose,
  onChanged,
  onCheerChanged,
}: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("requests");
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [notifications, setNotifications] = useState<FeedNotification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<number>>(
    new Set()
  );
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [message, setMessage] = useState("");
  const [likedNotificationIds, setLikedNotificationIds] = useState<Set<number>>(
    new Set()
  );

  const unreadCheerCount = useMemo(
    () =>
      notifications.filter(
        (item) => !item.read_at && !readNotificationIds.has(item.id)
      ).length,
    [notifications, readNotificationIds]
  );

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    setReadNotificationIds(loadReadNotificationIds());
    void loadRequests();
    void loadNotifications();

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!open || activeTab !== "cheers" || notifications.length === 0) return;

    const next = loadReadNotificationIds();
    notifications.forEach((item) => next.add(item.id));
    saveReadNotificationIds(next);
    setReadNotificationIds(next);
    onCheerChanged?.(0);
  }, [activeTab, notifications, onCheerChanged, open]);

  if (!open) return null;

  const showMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2200);
  };

  async function loadRequests() {
    try {
      setLoadingRequests(true);
      const data = await getFriendRequests();
      setRequests(data);
      onChanged?.(data.length);
    } catch {
      showMessage("친구 요청 목록을 불러오지 못했어요.");
    } finally {
      setLoadingRequests(false);
    }
  }

  async function loadNotifications() {
    try {
      setLoadingNotifications(true);
      const data = await getFeedNotifications();
      setNotifications(data);
      const readIds = loadReadNotificationIds();
      onCheerChanged?.(
        data.filter((item) => !item.read_at && !readIds.has(item.id)).length
      );
    } catch {
      showMessage("응원 알림을 불러오지 못했어요.");
    } finally {
      setLoadingNotifications(false);
    }
  }

  const handleAccept = async (requestId: number) => {
    try {
      await acceptFriendRequest(requestId);
      showMessage("친구 요청을 수락했어요.");
      await loadRequests();
    } catch {
      showMessage("친구 요청 수락에 실패했어요.");
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await rejectFriendRequest(requestId);
      showMessage("친구 요청을 거절했어요.");
      await loadRequests();
    } catch {
      showMessage("친구 요청 거절에 실패했어요.");
    }
  };

  const toggleLike = (notificationId: number) => {
    setLikedNotificationIds((prev) => {
      const next = new Set(prev);
      if (next.has(notificationId)) {
        next.delete(notificationId);
      } else {
        next.add(notificationId);
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#163126]/28 px-4 py-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <section className="relative z-10 flex max-h-[86vh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-[#163126]/10 bg-white shadow-[0_28px_90px_rgba(22,49,38,0.22)]">
        <div className="flex items-center justify-between gap-4 border-b border-[#163126]/8 px-5 py-5">
          <div>
            <h2 className="text-lg font-bold text-[#163126]">친구 알림</h2>
            <p className="mt-1 text-sm text-[#163126]/55">
              요청은 빠르게 처리하고, 응원은 따뜻하게 확인해요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#163126]/10 text-[#163126] transition hover:bg-[#f6faf7]"
            aria-label="친구 알림 닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-[#163126]/8 px-5 pt-4">
          <div className="grid grid-cols-2 gap-2">
            <TabButton
              active={activeTab === "requests"}
              count={requests.length}
              label="받은 요청"
              onClick={() => setActiveTab("requests")}
            />
            <TabButton
              active={activeTab === "cheers"}
              count={unreadCheerCount || notifications.length}
              label="응원 알림"
              onClick={() => setActiveTab("cheers")}
            />
          </div>

          <div className="flex items-center justify-between gap-3 py-4">
            <button
              type="button"
              onClick={() =>
                activeTab === "requests"
                  ? void loadRequests()
                  : void loadNotifications()
              }
              disabled={loadingRequests || loadingNotifications}
              className="inline-flex items-center gap-2 rounded-full border border-[#dce9e0] bg-white px-4 py-2 text-xs font-bold text-[#2E7D5B] transition hover:bg-[#f4fbf6] disabled:opacity-60"
            >
              <RefreshCw size={13} />
              {loadingRequests || loadingNotifications
                ? "새로고침 중"
                : activeTab === "requests"
                  ? "요청 새로고침"
                  : "응원 새로고침"}
            </button>

            {activeTab === "cheers" && unreadCheerCount > 0 && (
              <span className="rounded-full bg-[#ecf9f1] px-3 py-1.5 text-xs font-black text-[#2E7D5B]">
                새 응원 {unreadCheerCount}개
              </span>
            )}
          </div>

          {message && (
            <p className="mb-4 rounded-2xl bg-[#f4faf6] px-4 py-3 text-sm font-semibold text-[#2E7D5B]">
              {message}
            </p>
          )}
        </div>

        <div className="min-h-[300px] overflow-auto px-5 py-5">
          <AnimatePresence mode="wait">
            {activeTab === "requests" ? (
              <motion.div
                key="requests"
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 18 }}
                transition={{ duration: 0.18 }}
              >
                <FriendRequestList
                  loading={loadingRequests}
                  requests={requests}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              </motion.div>
            ) : (
              <motion.div
                key="cheers"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.18 }}
              >
                <EncouragementFeed
                  likedIds={likedNotificationIds}
                  loading={loadingNotifications}
                  notifications={notifications}
                  readIds={readNotificationIds}
                  onLike={toggleLike}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

function TabButton({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-center justify-center gap-2 px-3 pb-3 pt-2 text-sm font-black transition ${
        active ? "text-[#2E7D5B]" : "text-[#163126]/45 hover:text-[#163126]"
      }`}
    >
      <span>{label}</span>
      <span
        className={`min-w-6 rounded-full px-2 py-0.5 text-xs transition ${
          active
            ? "bg-[#2E7D5B] text-white"
            : "bg-[#eef5f0] text-[#2E7D5B] group-hover:bg-[#dff4e7]"
        }`}
      >
        {count}
      </span>
      <span
        className={`absolute bottom-0 h-0.5 rounded-full bg-[#2E7D5B] transition-all ${
          active ? "left-3 right-3 opacity-100" : "left-1/2 right-1/2 opacity-0"
        }`}
      />
    </button>
  );
}

function FriendRequestList({
  loading,
  requests,
  onAccept,
  onReject,
}: {
  loading: boolean;
  requests: FriendRequest[];
  onAccept: (requestId: number) => void;
  onReject: (requestId: number) => void;
}) {
  if (loading && requests.length === 0) {
    return <EmptyState title="요청을 불러오는 중이에요" />;
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        title="새 친구를 기다려요"
        description="받은 친구 요청이 생기면 여기에서 확인할 수 있어요."
      />
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <motion.div
          key={request.id}
          whileHover={{ scale: 1.015 }}
          className="flex items-center justify-between gap-3 rounded-[22px] border border-[#163126]/8 bg-[#fbfdfb] px-4 py-3 transition-shadow hover:shadow-[0_14px_30px_rgba(46,125,91,0.08)]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <ProfileNameAvatar
              name={request.requester_nickname}
              image={request.requester_profile_image}
              className="h-11 w-11"
              textClassName="text-[10px]"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#163126]">
                {request.requester_nickname}
              </p>
              <p className="mt-1 text-xs text-[#163126]/45">
                친구 요청을 보냈어요.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => onAccept(request.id)}
              className="inline-flex items-center gap-1 rounded-full bg-[#07955f] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#08794f]"
            >
              <Check size={14} />
              수락
            </button>
            <button
              type="button"
              onClick={() => onReject(request.id)}
              className="inline-flex items-center gap-1 rounded-full border border-[#163126]/10 bg-white px-3.5 py-2 text-xs font-bold text-[#163126]/60 transition hover:bg-[#f6faf7]"
            >
              <X size={14} />
              거절
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function EncouragementFeed({
  likedIds,
  loading,
  notifications,
  readIds,
  onLike,
}: {
  likedIds: Set<number>;
  loading: boolean;
  notifications: FeedNotification[];
  readIds: Set<number>;
  onLike: (notificationId: number) => void;
}) {
  if (loading && notifications.length === 0) {
    return <EmptyState title="응원을 불러오는 중이에요" />;
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        title="아직 응원이 없어요"
        description="친구 활동이 생기면 보여드릴게요."
      />
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => {
        const read = Boolean(notification.read_at || readIds.has(notification.id));
        const liked = likedIds.has(notification.id);

        return (
          <motion.article
            key={notification.id}
            whileHover={{ scale: 1.015 }}
            className={`relative overflow-hidden rounded-[24px] border px-4 py-4 transition-all hover:shadow-[0_16px_34px_rgba(46,125,91,0.10)] ${
              read
                ? "border-[#163126]/6 bg-[#fbfdfb] opacity-72"
                : "border-[#9fd8b2] bg-[#f4fbf6]"
            }`}
          >
            {!read && (
              <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-[#2E7D5B]" />
            )}

            <div className="flex gap-3">
              <div className="shrink-0">
                <img
                  src="/images/buddy-friend.png"
                  alt=""
                  className="h-16 w-16 object-contain"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="relative rounded-[20px] bg-white px-4 py-3 shadow-[0_10px_24px_rgba(46,125,91,0.06)]">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#2E7D5B]">
                    버디가 응원해요!
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#163126]">
                    {notification.message ||
                      `"${notification.challenge_title ?? "오늘의 챌린지"}" 정말 잘했어요 💚`}
                  </p>
                  <span className="absolute -left-1.5 top-6 h-3 w-3 rotate-45 bg-white" />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <ProfileNameAvatar
                      name={notification.sender_nickname}
                      image={notification.sender_profile_image}
                      className="h-8 w-8"
                      textClassName="text-[9px]"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-[#163126]">
                        {notification.sender_nickname}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] font-semibold text-[#163126]/42">
                        {notification.challenge_title ?? "친구 활동"}
                      </p>
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 1.18 }}
                    onClick={() => onLike(notification.id)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-black transition ${
                      liked
                        ? "bg-[#ffe9ef] text-[#e84d73]"
                        : "bg-white text-[#2E7D5B] hover:bg-[#ecf9f1]"
                    }`}
                  >
                    <Heart size={14} fill={liked ? "currentColor" : "none"} />
                    {liked ? "응원했어요" : "응원하기"}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}

function loadReadNotificationIds() {
  if (typeof window === "undefined") return new Set<number>();

  try {
    return new Set<number>(
      JSON.parse(window.localStorage.getItem(CHEER_NOTIFICATION_READ_KEY) ?? "[]")
    );
  } catch {
    return new Set<number>();
  }
}

function saveReadNotificationIds(ids: Set<number>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    CHEER_NOTIFICATION_READ_KEY,
    JSON.stringify([...ids].slice(-100))
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
