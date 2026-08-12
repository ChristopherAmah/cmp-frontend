import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CONTRACT_STATUS_TOOLTIPS = {
  draft: "This contract is still being prepared. You can edit all details. Invoices cannot be created yet.",
  pending_signature: "This contract has been sent for signature and is awaiting all required signers.",
  active: "This contract is fully signed and in effect. You can now create invoices.",
  expired: "This contract has reached its end date. No new invoices can be created.",
  terminated: "This contract was ended early and is no longer active.",
  cancelled: "This contract was cancelled before becoming active.",
  renewed: "This contract has been renewed. Activate it to resume invoicing.",
};

const INVOICE_STATUS_TOOLTIPS = {
  draft: "This invoice has not been sent to the client yet and can still be edited.",
  issued: "This invoice has been sent to the client and is awaiting payment.",
  partially_paid: "Some payment has been received. Balance remains outstanding.",
  paid: "This invoice has been fully paid.",
  overdue: "The due date has passed and payment is still outstanding.",
  voided: "This invoice has been cancelled and is no longer valid for payment.",
};

export const ContractStatusBadge = ({ status, className, ...props }) => {
  const tooltip = CONTRACT_STATUS_TOOLTIPS[status] || "";
  const displayStatus = status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  if (!tooltip) {
    return (
      <Badge variant="outline" className={className} {...props}>
        {displayStatus}
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={className} {...props}>
            {displayStatus}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const InvoiceStatusBadge = ({ 
  status, 
  className, 
  daysOverdue = null,
  paymentProgress = null,
  ...props 
}) => {
  const tooltip = INVOICE_STATUS_TOOLTIPS[status] || "";
  const displayStatus = status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  let tooltipText = tooltip;
  if (daysOverdue !== null && daysOverdue > 0) {
    tooltipText += ` ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue.`;
  }
  if (paymentProgress !== null) {
    tooltipText += ` ${paymentProgress.toFixed(1)}% paid.`;
  }

  if (!tooltipText) {
    return (
      <Badge variant="outline" className={className} {...props}>
        {displayStatus}
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={className} {...props}>
            {displayStatus}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
