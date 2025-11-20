import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="p-6">
      <Skeleton className="h-10 w-1/4 mb-4" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}
