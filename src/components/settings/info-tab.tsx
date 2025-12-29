import { $api } from "@/utils/api";
import { memo } from "react";
import IcRoundDesktopWindows from "~icons/ic/round-desktop-windows";
import IcRoundDns from "~icons/ic/round-dns";
import { motion } from "framer-motion";

export const InfoTab = memo(() => {
  const { data: version } = $api.useQuery("get", "/version");
  const uiVersion = import.meta.env.UI_VERSION || "development";

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-surface rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 border border-outline-variant/50"
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <IcRoundDesktopWindows className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold mb-0.5">UI Information</h3>
            <div className="mt-3 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface-variant">Version</span>
                {uiVersion === "development" ? (
                  <span className="text-base font-semibold">Development</span>
                ) : (
                  <a
                    href={`https://github.com/tgdrive/teldrive-ui/commits/${uiVersion}`}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="text-base font-semibold text-primary hover:underline decoration-2 underline-offset-4"
                  >
                    {uiVersion.substring(0, 7)}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-surface rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 border border-outline-variant/50"
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <IcRoundDns className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold mb-0.5">Server Information</h3>
            {version ? (
              <div className="mt-3 space-y-2.5">
                {Object.entries(version).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm text-on-surface-variant capitalize">
                      {key}
                    </span>
                    {key === "version" && val ? (
                      <a
                        href={`https://github.com/tgdrive/teldrive/commits/${val}`}
                        rel="noopener noreferrer"
                        target="_blank"
                        className="text-base font-semibold text-primary hover:underline decoration-2 underline-offset-4"
                      >
                        {val.substring(0, 7)}
                      </a>
                    ) : (
                      <span className="text-base font-semibold">
                        {val || "N/A"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-sm text-on-surface-variant">
                  Could not load server version.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
});
