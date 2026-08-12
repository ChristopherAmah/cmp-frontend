import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  Loader2,
  CheckCheck,
} from "lucide-react";
import { formatDate } from "../lib/utils";
import { useToast } from "@/hooks/use-toast";

// Mock notifications - in production, fetch from API
const mockNotifications = [
  {
    id: 1,
    type: "warning",
    message: "3 contracts expiring soon",
    description: "Contracts #1234, #1235, and #1236 will expire within the next 7 days.",
    time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    unread: true,
    link: "/contracts",
  },
  {
    id: 2,
    type: "info",
    message: "New invoice created",
    description: "Invoice INV-2024-001 has been created for Contract #1234.",
    time: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    unread: true,
    link: "/invoices",
  },
  {
    id: 3,
    type: "success",
    message: "Payment received for INV-001",
    description: "Payment of $5,000 has been received for Invoice INV-2024-001.",
    time: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    unread: false,
    link: "/invoices",
  },
  {
    id: 4,
    type: "warning",
    message: "Document upload required",
    description: "Contract #1234 is missing required documents. Please upload them soon.",
    time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    unread: false,
    link: "/contracts",
  },
];

const TYPE_ICONS = {
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};

const TYPE_COLORS = {
  warning: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800",
  info: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
  success: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800",
};

const Notifications = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => n.unread)
      : notifications;

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
    toast({
      title: "Notification marked as read",
      variant: "success",
    });
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    toast({
      title: "All notifications marked as read",
      variant: "success",
    });
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast({
      title: "Notification deleted",
      variant: "success",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              Stay updated with your recent activity and important alerts
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={markAllAsRead}
                className="flex items-center gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === "all"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === "unread"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground">
                  {filter === "unread"
                    ? "You're all caught up! No unread notifications."
                    : "You don't have any notifications yet."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const Icon = TYPE_ICONS[notification.type];
              const timeAgo =
                notification.time instanceof Date
                  ? formatDate(notification.time.toISOString())
                  : notification.time;

              return (
                <Card
                  key={notification.id}
                  className={`transition-all duration-200 ${
                    notification.unread
                      ? "border-primary/50 bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${
                          TYPE_COLORS[notification.type]
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3
                                className={`text-sm font-semibold ${
                                  notification.unread
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {notification.message}
                              </h3>
                              {notification.unread && (
                                <Badge
                                  variant="outline"
                                  className="h-2 w-2 p-0 rounded-full bg-primary border-primary"
                                />
                              )}
                            </div>
                            {notification.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {notification.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {timeAgo}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {notification.unread && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => markAsRead(notification.id)}
                                className="h-8 w-8"
                                title="Mark as read"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteNotification(notification.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              title="Delete"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
