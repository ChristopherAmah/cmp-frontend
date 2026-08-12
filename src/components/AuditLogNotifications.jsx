import { useState, useEffect, useRef, useMemo } from "react";
import { auditLogService } from "../services/auditLogService";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  X,
  AlertTriangle,
  Shield,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { formatDate } from "../lib/utils";
import { useNotificationManager } from "@/contexts/NotificationManager";
import { useNavigate } from "react-router-dom";

const SEVERITY_COLORS = {
  high: "bg-orange-600 dark:bg-orange-700",
  critical: "bg-purple-600 dark:bg-purple-700",
};

const STATUS_ICONS = {
  success: CheckCircle2,
  failure: AlertTriangle,
  pending: Clock,
};

const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Admin",
  developer: "Developer",
  user: "User",
};

/**
 * Real-time audit log notifications for super admin
 * Polls for recent critical/high severity actions and displays notifications
 */
const AuditLogNotifications = () => {
  const { user } = useAuth();
  const notificationManager = useNotificationManager();
  const { showNotification } = notificationManager || {};
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [polling, setPolling] = useState(false);
  // Use ref to persist shown IDs across renders
  const shownNotificationIdsRef = useRef(new Set());
  const notificationsRef = useRef([]);
  const lastCheckedRef = useRef(null);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  
  // Memoize unreadCount to prevent unnecessary re-renders
  const unreadCount = useMemo(() => notifications.length, [notifications.length]);

  // Only show for super admin
  if (user?.role !== "super_admin") {
    return null;
  }

  // Keep refs in sync with state
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    // Don't fetch on initial mount - wait for user interaction
    // This prevents replaying notifications on page load
    
    // Set up polling every 60 seconds after initial delay
    timeoutRef.current = setTimeout(() => {
      fetchRecentCriticalActions();
      
      // Then poll every 60 seconds (reduced frequency)
      intervalRef.current = setInterval(() => {
        fetchRecentCriticalActions();
      }, 60000); // 60 seconds
    }, 2000); // 2 second delay to ensure user has interacted

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchRecentCriticalActions is stable and doesn't need to be in deps

  const fetchRecentCriticalActions = async () => {
    // Prevent concurrent requests
    if (polling) {
      return;
    }

    try {
      setPolling(true);
      // Use ref to avoid stale closures
      const since = lastCheckedRef.current || new Date(Date.now() - 5 * 60 * 1000); // Last 5 minutes for initial, then since last check
      const response = await auditLogService.getRecentCritical(since.toISOString());

      if (response?.status === "success" && response.data) {
        // Filter out notifications we've already shown
        // Use refs to get current values without stale closures
        const newNotifications = response.data.filter(
          (log) => {
            // Check if we've already seen this notification
            const alreadyShown = shownNotificationIdsRef.current.has(log._id);
            // Check if it's already in our notifications list
            const alreadyInList = notificationsRef.current.find((n) => n._id === log._id);
            // Only include if it's new and matches severity criteria
            return !alreadyShown && !alreadyInList && (log.severity === "high" || log.severity === "critical");
          }
        );

        if (newNotifications.length > 0) {
          console.log(`[AuditLogNotifications] Found ${newNotifications.length} new notifications`);
          
          // Update notifications list
          setNotifications((prev) => {
            const updated = [...newNotifications, ...prev].slice(0, 50); // Keep last 50
            notificationsRef.current = updated;
            return updated;
          });
          // Update ref instead of state to avoid re-renders
          lastCheckedRef.current = new Date();

          // Queue notifications - they will show sequentially automatically with sound
          // The NotificationManager will handle deduplication via eventId
          newNotifications.forEach((log) => {
            // Mark as shown in our ref immediately to prevent duplicates
            shownNotificationIdsRef.current.add(log._id);
            
            // Ensure showNotification is available
            if (showNotification && typeof showNotification === "function") {
              // Show notification (NotificationManager will also check its own seenEventIdsRef)
              // silent: true - no sound for audit log notifications
              showNotification({
                title: `${log.severity.toUpperCase()}: ${log.action}`,
                description: `${log.userName} (${ROLE_LABELS[log.userRole] || log.userRole}) performed: ${log.action} on ${log.resourceType}`,
                variant: log.severity === "critical" ? "critical" : "warning",
                eventId: log._id, // Use event ID for deduplication in NotificationManager
                silent: true, // No sound for audit log notifications
              });
            }
          });
        } else {
          // Update lastChecked even if no new notifications to avoid refetching same data
          lastCheckedRef.current = new Date();
        }
      }
    } catch (error) {
      console.error("Error fetching critical actions:", error);
    } finally {
      setPolling(false);
    }
  };

  const handleViewLogs = () => {
    setShowDialog(false);
    navigate("/audit-logs");
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    notificationsRef.current = [];
    lastCheckedRef.current = new Date();
    // Note: We don't clear shownNotificationIdsRef to prevent re-showing old notifications
    // If user wants to see them again, they can refresh the page
  };

  return (
    <>
      {/* Notification Bell - Clean and Responsive */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowDialog(true)}
        className="relative h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 lg:h-14 lg:w-14 rounded-md hover:bg-accent/50 active:bg-accent transition-all duration-200 touch-manipulation flex items-center justify-center"
        title="Audit Log Notifications"
      >
        <Bell className="h-5 w-5 sm:h-5 sm:w-5 md:h-5 md:w-5 lg:h-6 lg:w-6 text-foreground/80 hover:text-foreground" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6 flex items-center justify-center p-0 text-[10px] sm:text-[11px] md:text-xs font-semibold rounded-full min-w-[20px] sm:min-w-[20px] md:min-w-[24px] border-2 border-background pointer-events-none"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Audit Log Notifications
              </DialogTitle>
              <DialogDescription>
                Recent critical and high-severity actions
              </DialogDescription>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Recent Critical Actions</h3>
                <p className="text-muted-foreground">
                  All clear! No high or critical severity actions in the last 24 hours.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((log) => {
                  const StatusIcon = STATUS_ICONS[log.status] || Clock;

                  return (
                    <div
                      key={log._id}
                      className={`p-4 rounded-lg border ${
                        log.severity === "critical"
                          ? "border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20"
                          : "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              className={`${SEVERITY_COLORS[log.severity]} text-white`}
                            >
                              {log.severity}
                            </Badge>
                            <span className="font-semibold text-sm">{log.action}</span>
                            <StatusIcon
                              className={`h-4 w-4 ${
                                log.status === "success"
                                  ? "text-green-600"
                                  : log.status === "failure"
                                  ? "text-red-600"
                                  : "text-amber-600"
                              }`}
                            />
                          </div>
                          <div className="text-sm space-y-1.5">
                            <div>
                              <span className="font-medium">User:</span>{" "}
                              <span className="text-foreground">{log.userName}</span>{" "}
                              <span className="text-muted-foreground">({ROLE_LABELS[log.userRole] || log.userRole})</span>
                            </div>
                            <div>
                              <span className="font-medium">Resource:</span>{" "}
                              <span className="text-foreground">{log.resourceType}</span>
                              {log.resourceName && (
                                <span className="text-muted-foreground"> - {log.resourceName}</span>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">Severity:</span>{" "}
                              <span className="text-foreground capitalize">{log.severity}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(log.createdAt)}
                            </div>
                            {log.errorMessage && (
                              <div className="text-xs text-destructive mt-2">
                                Error: {log.errorMessage}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="flex items-center justify-between gap-2 pt-4 border-t">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearNotifications}
              >
                Clear All
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Close
              </Button>
              <Button onClick={handleViewLogs}>View All Audit Logs</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AuditLogNotifications;
