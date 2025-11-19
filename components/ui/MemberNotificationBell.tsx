import React, { useState, useEffect } from 'react';
import { Bell, ShoppingBag, CreditCard, Receipt, Calendar, DollarSign, BadgeAlert } from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { io, Socket } from 'socket.io-client';
import { MemberData } from '@/app/members/actions';

interface MemberNotification {
  id: string;
  type: 'purchase' | 'credit' | 'payment_due' | 'account';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, any>;
}

interface MemberNotificationBellProps {
  memberData: MemberData;
}

export function MemberNotificationBell({ memberData }: MemberNotificationBellProps) {
  const [notifications, setNotifications] = useState<MemberNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('unread');

  useEffect(() => {
    // Generate notifications based on member data
    const generatedNotifications: MemberNotification[] = [];
    
    // Add recent purchases
    if (memberData.purchaseHistory && memberData.purchaseHistory.length > 0) {
      // Get the 3 most recent purchases
      const recentPurchases = [...memberData.purchaseHistory]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);
      
      recentPurchases.forEach((purchase, index) => {
        generatedNotifications.push({
          id: `purchase-${purchase.id}`,
          type: 'purchase',
          title: 'Purchase Completed',
          message: `Your purchase of ${formatCurrency(purchase.total)} (${purchase.items} items) has been recorded.`,
          timestamp: new Date(purchase.date),
          read: index > 0, // Only the most recent purchase is unread
          data: { purchase }
        });
      });
    }
    
    // Add credit status notifications
    if (memberData.currentCredit > 0) {
      generatedNotifications.push({
        id: `credit-status-${Date.now()}`,
        type: 'credit',
        title: 'Credit Balance Update',
        message: `Your current credit balance is ${formatCurrency(memberData.currentCredit)}.`,
        timestamp: new Date(),
        read: false,
        data: { creditBalance: memberData.currentCredit }
      });
    }
    
    // Add due payments
    if (memberData.upcomingPayments && memberData.upcomingPayments.length > 0) {
      memberData.upcomingPayments.forEach((payment, index) => {
        if (payment.dueDate) {
          const dueDate = new Date(payment.dueDate);
          const today = new Date();
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          let urgencyMessage = "";
          if (diffDays < 0) {
            urgencyMessage = "This payment is overdue!";
          } else if (diffDays === 0) {
            urgencyMessage = "This payment is due today!";
          } else if (diffDays <= 7) {
            urgencyMessage = `This payment is due in ${diffDays} days.`;
          } else {
            urgencyMessage = `Due date: ${formatDate(dueDate)}`;
          }
          
          generatedNotifications.push({
            id: `payment-due-${payment.id}`,
            type: 'payment_due',
            title: diffDays < 0 ? 'Overdue Payment' : 'Upcoming Payment',
            message: `Payment of ${formatCurrency(payment.amount)} is due. ${urgencyMessage}`,
            timestamp: new Date(),
            read: diffDays > 7, // Only mark as read if due date is more than 7 days away
            data: { payment, daysUntilDue: diffDays }
          });
        }
      });
    }
    
    // Add account notifications (join date anniversary)
    if (memberData.joinDate) {
      const joinDate = new Date(memberData.joinDate);
      const today = new Date();
      
      // Check if today is the member's anniversary (same day and month)
      if (joinDate.getDate() === today.getDate() && joinDate.getMonth() === today.getMonth()) {
        const yearsAsMember = today.getFullYear() - joinDate.getFullYear();
        
        if (yearsAsMember > 0) {
          generatedNotifications.push({
            id: `anniversary-${yearsAsMember}`,
            type: 'account',
            title: 'Membership Anniversary',
            message: `Congratulations! You've been a member for ${yearsAsMember} ${yearsAsMember === 1 ? 'year' : 'years'}.`,
            timestamp: new Date(),
            read: false,
            data: { yearsAsMember }
          });
        }
      }
    }
    
    // Set the generated notifications
    setNotifications(generatedNotifications);
    setUnreadCount(generatedNotifications.filter(n => !n.read).length);
  }, [memberData]);
  
  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };
  
  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ShoppingBag className="h-4 w-4 text-green-600" />;
      case 'credit':
        return <CreditCard className="h-4 w-4 text-amber-600" />;
      case 'payment_due':
        return <Calendar className="h-4 w-4 text-red-600" />;
      case 'account':
        return <BadgeAlert className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };
  
  // Format time ago
  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(timestamp).getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    return formatDate(timestamp);
  };
  
  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'unread') {
      return !notification.read;
    }
    return true; // 'all' tab shows everything
  });
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-amber-500">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-medium">My Notifications</h4>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
          </div>
        </div>
        
        <Tabs defaultValue="unread" value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'unread')}>
          <div className="border-b">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="unread" className="rounded-none">
                Unread {unreadCount > 0 && <Badge className="ml-1 bg-amber-500">{unreadCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="all" className="rounded-none">All</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="unread" className="m-0">
            <ScrollArea className="h-[400px]">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p>No unread notifications</p>
                </div>
              ) : (
                <div>
                  {filteredNotifications.map((notification) => (
                    <NotificationItem 
                      key={notification.id} 
                      notification={notification} 
                      markAsRead={markAsRead}
                      formatTimeAgo={formatTimeAgo}
                      getNotificationIcon={getNotificationIcon}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="all" className="m-0">
            <ScrollArea className="h-[400px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div>
                  {notifications.map((notification) => (
                    <NotificationItem 
                      key={notification.id} 
                      notification={notification} 
                      markAsRead={markAsRead}
                      formatTimeAgo={formatTimeAgo}
                      getNotificationIcon={getNotificationIcon}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

// Notification Item Component
function NotificationItem({ 
  notification, 
  markAsRead, 
  formatTimeAgo, 
  getNotificationIcon
}: { 
  notification: MemberNotification,
  markAsRead: (id: string) => void,
  formatTimeAgo: (date: Date) => string,
  getNotificationIcon: (type: string) => React.ReactNode
}) {
  
  // Handle click on notification
  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };
  
  // Get background color based on notification type
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'purchase': return 'bg-green-50';
      case 'credit': return 'bg-amber-50';
      case 'payment_due': return notification.data?.daysUntilDue < 0 ? 'bg-red-50' : 'bg-orange-50';
      case 'account': return 'bg-blue-50';
      default: return 'bg-gray-50';
    }
  };
  
  // Get indicator color based on notification type
  const getIndicatorColor = (type: string) => {
    switch (type) {
      case 'purchase': return 'bg-green-500';
      case 'credit': return 'bg-amber-500';
      case 'payment_due': return notification.data?.daysUntilDue < 0 ? 'bg-red-500' : 'bg-orange-500';
      case 'account': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <div 
      className={`border-b last:border-0 ${notification.read ? 'opacity-80' : 'bg-amber-50/30'}`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors">
        <div className={`mt-0.5 h-9 w-9 rounded-full ${getTypeColor(notification.type)} flex items-center justify-center flex-shrink-0`}>
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{notification.title}</p>
            {!notification.read && (
              <div className={`h-2 w-2 rounded-full ${getIndicatorColor(notification.type)}`}></div>
            )}
          </div>
          <p className="text-sm text-gray-600">{notification.message}</p>
          <p className="text-xs text-gray-400">{formatTimeAgo(notification.timestamp)}</p>
        </div>
      </div>
    </div>
  );
} 