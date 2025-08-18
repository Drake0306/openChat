import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenuSkeleton } from '@/components/ui/sidebar';

export function SidebarSkeleton() {
  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="flex flex-col h-full">
        {/* New Chat Button Skeleton */}
        <div className="p-2">
          <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse" />
        </div>
        
        {/* Navigation Skeleton */}
        <div className="p-2 space-y-2">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          <SidebarMenuSkeleton showIcon />
          <SidebarMenuSkeleton showIcon />
        </div>
        
        {/* Chat History Skeleton */}
        <div className="flex-1 p-2 space-y-2">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SidebarMenuSkeleton />
              <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse ml-2" />
            </div>
          ))}
        </div>
      </SidebarContent>
      
      <SidebarFooter>
        {/* User Info Skeleton */}
        <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1 space-y-1">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        
        {/* Sign Out Button Skeleton */}
        <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse mt-2" />
      </SidebarFooter>
    </Sidebar>
  );
}

export function ChatLoadingSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Chat messages area */}
      <div className="flex-1 p-4 space-y-4">
        {/* Loading skeleton for messages */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Chat input area */}
      <div className="border-t p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-20 w-full bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-20 bg-gray-200 rounded animate-pulse ml-auto" />
      </div>
    </div>
  );
}