"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import {
  acceptFriendRequest,
  getFriendRequests,
  rejectFriendRequest,
  type FriendRequest,
} from "@/src/api/social";
import ProfileNameAvatar from "@/src/components/ProfileNameAvatar";

type Props = {
  open: boolean;
  onClose: () => void;
  onChanged?: (count: number) => void;
};

export default function FriendRequestModal({
  open,
  onClose,
  onChanged,
}: Props) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    void loadRequests();

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const showMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2200);
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getFriendRequests();
      setRequests(data);
      onChanged?.(data.length);
    } catch {
      showMessage("친구 요청 목록을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#163126]/28 px-4 py-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <section className="relative z-10 flex max-h-[86vh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-[#163126]/10 bg-white shadow-[0_28px_90px_rgba(22,49,38,0.22)]">
        <div className="flex items-center justify-between gap-4 border-b border-[#163126]/8 px-5 py-5">
          <div>
            <h2 className="text-lg font-bold text-[#163126]">받은 요청</h2>
            <p className="mt-1 text-sm text-[#163126]/55">
              친구 요청을 수락하거나 거절할 수 있어요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#163126]/10 text-[#163126] transition hover:bg-[#f6faf7]"
            aria-label="받은 요청 닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-[#163126]/8 px-5 py-4">
          <button
            type="button"
            onClick={() => void loadRequests()}
            disabled={loading}
            className="rounded-full border border-[#dce9e0] bg-white px-4 py-2 text-xs font-bold text-[#2E7D5B] transition hover:bg-[#f4fbf6] disabled:opacity-60"
          >
            {loading ? "새로고침 중" : "요청 새로고침"}
          </button>
          {message && (
            <p className="mt-3 rounded-2xl bg-[#f4faf6] px-4 py-3 text-sm font-semibold text-[#2E7D5B]">
              {message}
            </p>
          )}
        </div>

        <div className="min-h-[260px] overflow-auto px-5 py-5">
          {loading && requests.length === 0 ? (
            <EmptyState title="요청을 불러오는 중이에요" />
          ) : requests.length === 0 ? (
            <EmptyState
              title="받은 친구 요청이 없어요"
              description="새로운 친구 요청이 오면 여기에서 확인할 수 있어요."
            />
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between gap-3 rounded-[22px] border border-[#163126]/8 bg-[#fbfdfb] px-4 py-3"
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
                      onClick={() => void handleAccept(request.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#07955f] text-white transition hover:bg-[#08794f]"
                      aria-label="친구 요청 수락"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleReject(request.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#163126]/10 bg-white text-[#163126]/60 transition hover:bg-[#f6faf7]"
                      aria-label="친구 요청 거절"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
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
