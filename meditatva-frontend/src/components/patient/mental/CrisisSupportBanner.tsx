import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CrisisSupportBannerProps {
  onTalkToCounselor: () => void;
}

export const CrisisSupportBanner: React.FC<CrisisSupportBannerProps> = ({
  onTalkToCounselor,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6"
    >
      <Card className="border-red-200 dark:border-red-900/40 bg-gradient-to-r from-red-50 via-pink-50 to-red-50 dark:from-red-950/20 dark:via-pink-950/20 dark:to-red-950/20">
        <div className="p-4 sm:p-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
                We care about your wellbeing
              </h3>
              <p className="text-sm text-red-800 dark:text-red-200 mb-4">
                If you're experiencing thoughts of self-harm or suicide, please reach out to someone
                you trust or contact emergency services. You're not alone, and help is available.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={onTalkToCounselor}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Talk to Counselor Now
                </Button>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-700 dark:border-red-700 dark:text-red-300"
                >
                  Emergency Resources
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
