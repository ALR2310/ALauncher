export default function ContentCardSkeleton() {
  return (
    <div className="flex gap-4 p-3 h-[120px] bg-base-100 rounded-box">
      <div className="skeleton w-24 h-24"></div>

      <div className="flex-1 justify-between">
        <div className="flex">
          <div className="flex-4/5 space-y-1">
            <div className="skeleton h-7 w-[60%]"></div>

            <div className="skeleton h-5 w-[90%]"></div>
          </div>

          <div className="flex-1/5 skeleton h-10"></div>
        </div>

        <div className="divider m-0"></div>

        <div className="w-full h-6"></div>
      </div>
    </div>
  );
}
