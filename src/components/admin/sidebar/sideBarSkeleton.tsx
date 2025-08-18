import { Skeleton } from "../../ui/skeleton";

const SideBarSkeleton = () => {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
};

export default SideBarSkeleton;
