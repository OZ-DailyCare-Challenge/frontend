export default function DashboardBottomBuddy() {
  return (
    <section className="relative min-h-[260px] min-w-0 overflow-hidden rounded-[28px] border border-[#163126]/8 bg-[#f1f6f1] shadow-[0_18px_50px_rgba(46,125,91,0.06)]">
      <img
        src="/images/buddy-forest.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[28%_50%] sm:object-[32%_50%]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.18)_55%,rgba(255,255,255,0.34)_100%)]" />

      <div className="relative z-10 min-h-[260px]">
        <div className="absolute left-[38%] top-[7%] w-[min(330px,56%)] rounded-[24px] bg-white/88 px-4 py-4 text-center shadow-[0_16px_40px_rgba(22,49,38,0.12)] backdrop-blur-sm sm:left-[36%] sm:top-[8%] sm:w-[min(360px,58%)] sm:rounded-[28px] sm:px-5 sm:py-5 lg:left-[35%] lg:top-[10%]">
          <span className="absolute left-[-9px] top-[66%] h-5 w-5 -translate-y-1/2 rotate-45 bg-white/88" />
          <p className="relative text-base font-bold leading-6 text-[#163126] sm:text-lg">
            오늘의 작은 실천, 버디가 기억할게요!
          </p>
          <p className="relative mt-2 text-xs font-medium leading-5 text-[#6f7d73] sm:text-sm">
            천천히 해도 괜찮아요. 같이 건강해져요.
          </p>
        </div>
      </div>
    </section>
  );
}
