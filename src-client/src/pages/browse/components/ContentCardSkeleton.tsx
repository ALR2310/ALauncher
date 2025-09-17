export default function ContentCardSkeleton() {
  return (
    <div className="h-[120px] flex bg-base-100 p-3 rounded gap-4">
      <div className="skeleton w-24"></div>

      <div className="flex-1 flex flex-col justify-between">
        <div className="flex">
          <div className="flex-1 space-y-2">
            <div className="flex">
              <div className="h-4 skeleton w-2/4"></div>
              <div className="divider divider-horizontal"></div>
              <div className="h-4 skeleton w-1/4"></div>
            </div>
            <div className="h-4 skeleton w-4/5"></div>
          </div>

          <div className="w-[15%] skeleton btn"></div>
        </div>

        <div className="divider m-0"></div>

        <div className="flex justify-between">
          <div className="h-4 skeleton w-1/4"></div>
          <div className="h-4 skeleton w-2/4"></div>
        </div>
      </div>
    </div>
  );
}
