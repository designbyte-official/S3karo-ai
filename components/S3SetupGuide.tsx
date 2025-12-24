"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CORSSection from "@/components/s3/CORSSection";
import IAMSection from "@/components/s3/IAMSection";

interface S3SetupGuideProps {
  isOpen: boolean;
  onClose: () => void;
  bucketName?: string;
}

const S3SetupGuide = ({ isOpen, onClose, bucketName }: S3SetupGuideProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="shad-dialog-wide max-h-[90vh] overflow-y-auto remove-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-center h3 text-light-100">
            AWS S3 Setup Guide
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 mt-6">
          <CORSSection />
          <IAMSection bucketName={bucketName} />

          <div className="flex justify-end pt-4 border-t border-light-300">
            <Button 
              onClick={onClose} 
              className="modal-submit-button max-w-[200px]"
            >
              Got it
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default S3SetupGuide;
