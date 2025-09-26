"use client";

import Button from "../ui/Button";

interface ConsentPromptProps {
  onApprove: () => void;
  onReject: () => void;
  isProcessing: boolean;
}

export default function ConsentPrompt({
  onApprove,
  onReject,
  isProcessing,
}: ConsentPromptProps) {
  return (
    <div className="px-3 pt-1 pb-3">
      <div className="flex space-x-2 justify-end">
        <Button
          onClick={onReject}
          disabled={isProcessing}
          variant="secondary"
          size="md"
        >
          Reject
        </Button>
        <Button onClick={onApprove} disabled={isProcessing} size="md">
          Approve
        </Button>
      </div>
    </div>
  );
}
