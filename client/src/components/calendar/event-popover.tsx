import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Edit, Trash2, Calendar, Clock, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useConfetti } from "@/hooks/use-confetti";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { Event } from "@shared/schema";

interface EventPopoverProps {
  event: Event;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: (event: Event) => void;
}

const eventColors = {
  "#3B82F6": "bg-blue-500",
  "#EF4444": "bg-red-500",
  "#10B981": "bg-green-500",
  "#F59E0B": "bg-amber-500",
};

export default function EventPopover({ event, position, onClose, onEdit }: EventPopoverProps) {
  const { toast } = useToast();
  const { triggerDelete } = useConfetti();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/events/${event.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      triggerDelete();
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      deleteMutation.mutate();
    }
  };

  const handleEdit = () => {
    onEdit(event);
  };

  // Format date
  const eventDate = new Date(event.date + "T00:00:00");
  const formattedDate = format(eventDate, "MMMM d, yyyy");

  // Format time range
  const timeRange = event.startTime && event.endTime 
    ? `${event.startTime} - ${event.endTime}`
    : event.startTime
    ? `${event.startTime}`
    : "All day";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="fixed z-50"
      style={{
        left: Math.min(
          position.x,
          (typeof window !== "undefined" ? window.innerWidth : 0) - 320
        ),
        top: Math.min(
          position.y,
          (typeof window !== "undefined" ? window.innerHeight : 0) - 200
        ),
      }}
    >
      <Card className="w-80 shadow-xl glass border-border">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <div 
                className={`w-3 h-3 rounded-full ${eventColors[event.color as keyof typeof eventColors] || "bg-primary"}`}
              />
              <h4 className="font-semibold text-foreground truncate">
                {event.title}
              </h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-muted"
              data-testid="button-close-popover"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Event Details */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>{timeRange}</span>
            </div>
            {event.description && (
              <div className="flex items-start space-x-2">
                <FileText className="w-4 h-4 text-primary mt-0.5" />
                <span className="break-words">{event.description}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-2 mt-4 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="flex-1 glass border-border text-foreground hover:bg-muted liquid-transition"
              data-testid="button-edit-event"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex-1 glass border-border text-red-500 hover:bg-red-500/10 liquid-transition"
              data-testid="button-delete-event"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {deleteMutation.isPending ? "..." : "Delete"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
