import { memo, useCallback, useState } from "react";
import type { UserSession } from "@/types";
import { useQueryClient, useSuspenseQueries } from "@tanstack/react-query";
import {
  Button,
  Textarea,
  RadioGroup,
  Radio,
  Input,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Modal,
  ModalContent,
} from "@tw-material/react";
import IcRoundContentCopy from "~icons/ic/round-content-copy";
import IcRoundRemoveCircleOutline from "~icons/ic/round-remove-circle-outline";
import clsx from "clsx";
import { motion } from "framer-motion";

import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { copyDataToClipboard } from "@/utils/common";
import { scrollbarClasses } from "@/utils/classes";
import { $api } from "@/utils/api";

import type { components } from "@/lib/api";
import { NetworkError } from "@/utils/fetch-throw";
import SyncIcon from "~icons/material-symbols/sync";
import DeleteIcon from "~icons/material-symbols/delete";
import AddIcon from "~icons/material-symbols/add-circle";
import MaterialSymbolsSmartToy from "~icons/material-symbols/smart-toy";
import MaterialSymbolsTv from "~icons/material-symbols/tv";
import IcRoundSecurity from "~icons/ic/round-security";

const validateBots = (value?: string) => {
  if (value) {
    const regexPattern = /^\d{10}:[A-Za-z\d_-]{35}$/gm;
    return regexPattern.test(value) || "Invalid Token format";
  }
  return false;
};

const formatDate = (date: string) => {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const Session = memo(
  ({ appName, location, createdAt, valid, hash, current }: UserSession) => {
    const deleteSession = $api.useMutation("delete", "/users/sessions/{id}", {
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: $api.queryOptions("get", "/users/sessions").queryKey,
        });
      },
    });
    const queryClient = useQueryClient();

    return (
      <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30 hover:border-outline-variant hover:shadow-sm transition-all duration-300 relative group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${valid ? "bg-green-500" : "bg-red-500"}`}
            />
            <p className="font-medium text-base">{appName || "Unknown"}</p>
            {current && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                Current
              </span>
            )}
          </div>
          {(!current || !valid) && (
            <Button
              isIconOnly
              variant="text"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onPress={() =>
                deleteSession.mutateAsync({ params: { path: { id: hash } } })
              }
            >
              <DeleteIcon />
            </Button>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <span>Created</span>
            <span className="font-medium text-on-surface">•</span>
            <span className="font-medium text-on-surface">
              {formatDate(createdAt)}
            </span>
          </div>
          {location && (
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <span>Location</span>
              <span className="font-medium text-on-surface">•</span>
              <span className="font-medium text-on-surface">{location}</span>
            </div>
          )}
        </div>
      </div>
    );
  },
);

const ChannelCreateDialog = ({ handleClose }: { handleClose: () => void }) => {
  const queryClient = useQueryClient();
  const createChannel = $api.useMutation("post", "/users/channels", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get", "/users/channels"] });
      toast.success("Channel Added");
    },
  });

  const [channel, setChannel] = useState("");

  const onCreate = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();
      createChannel
        .mutateAsync({
          body: {
            channelName: channel,
          },
        })
        .then(() => handleClose());
    },
    [channel],
  );

  return (
    <>
      <ModalHeader className="flex flex-col gap-1">Create Channel</ModalHeader>
      <ModalBody as="form" id="add-channel" onSubmit={onCreate}>
        <Input
          size="lg"
          variant="bordered"
          classNames={{
            inputWrapper: "border-primary border-large",
          }}
          placeholder="Channel Name"
          autoFocus
          value={channel}
          onValueChange={setChannel}
        />
      </ModalBody>
      <ModalFooter>
        <Button className="font-normal" variant="text" onPress={handleClose}>
          Close
        </Button>
        <Button
          type="submit"
          form="add-channel"
          className="font-normal"
          variant="filledTonal"
          isDisabled={createChannel.isPending || !channel}
          isLoading={createChannel.isPending}
        >
          {createChannel.isPending ? "Creating" : "Create"}
        </Button>
      </ModalFooter>
    </>
  );
};

const BotRemoveDialog = ({
  handleClose,
  onRemove,
}: {
  handleClose: () => void;
  onRemove: () => void;
}) => {
  return (
    <>
      <ModalHeader className="flex flex-col gap-1">Remove All Bots</ModalHeader>
      <ModalBody>
        <p className="text-lg font-medium mt-2">
          Are you sure you want to remove all bots?
        </p>
        <p className="text-sm text-on-surface-variant mt-1">
          This action cannot be undone.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button className="font-normal" variant="text" onPress={handleClose}>
          Cancel
        </Button>
        <Button
          variant="filledTonal"
          className="font-normal bg-red-500/20 text-red-500 data-[hover=true]:bg-red-500/30"
          onPress={onRemove}
        >
          Remove All
        </Button>
      </ModalFooter>
    </>
  );
};

const ChannelDeleteDialog = ({
  channelId,
  handleClose,
}: {
  channelId: number;
  handleClose: () => void;
}) => {
  const queryClient = useQueryClient();

  const deleteChannel = $api.useMutation("delete", "/users/channels/{id}", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get", "/users/channels"] });
      toast.success("Channel Deleted");
    },
  });

  const onDelete = useCallback(() => {
    deleteChannel
      .mutateAsync({
        params: {
          path: {
            id: String(channelId),
          },
        },
      })
      .then(() => handleClose());
  }, [channelId]);
  return (
    <>
      <ModalHeader className="flex flex-col gap-1">Delete Channel</ModalHeader>
      <ModalBody>
        <p className="text-lg font-medium mt-2">
          Are you sure you want to delete this channel?
        </p>
      </ModalBody>
      <ModalFooter>
        <Button className="font-normal" variant="text" onPress={handleClose}>
          No
        </Button>
        <Button
          variant="filledTonal"
          classNames={{
            base: "font-normal",
          }}
          isLoading={deleteChannel.isPending}
          onPress={onDelete}
        >
          Yes
        </Button>
      </ModalFooter>
    </>
  );
};

interface ChannelOperationProps {
  open: boolean;
  handleClose: () => void;
  operation: "add" | "delete";
  channelId: number;
}

interface BotOperationProps {
  open: boolean;
  handleClose: () => void;
  onRemove: () => void;
}

const BotOperationModal = memo(
  ({ open, handleClose, onRemove }: BotOperationProps) => {
    return (
      <Modal
        isOpen={open}
        size="md"
        classNames={{
          wrapper: "overflow-hidden",
          base: "bg-surface w-full shadow-none",
        }}
        placement="center"
        onClose={handleClose}
        hideCloseButton
      >
        <ModalContent>
          <BotRemoveDialog handleClose={handleClose} onRemove={onRemove} />
        </ModalContent>
      </Modal>
    );
  },
);

const ChannelOperationModal = memo(
  ({ open, handleClose, operation, channelId }: ChannelOperationProps) => {
    const renderOperation = () => {
      switch (operation) {
        case "add":
          return <ChannelCreateDialog handleClose={handleClose} />;
        case "delete":
          return (
            <ChannelDeleteDialog
              channelId={channelId}
              handleClose={handleClose}
            />
          );
        default:
          return null;
      }
    };
    return (
      <Modal
        isOpen={open}
        size="md"
        classNames={{
          wrapper: "overflow-hidden",
          base: "bg-surface w-full shadow-none",
        }}
        placement="center"
        onClose={handleClose}
        hideCloseButton
      >
        <ModalContent>{renderOperation}</ModalContent>
      </Modal>
    );
  },
);

export const AccountTab = memo(() => {
  const { control, handleSubmit } = useForm<{ tokens: string }>({
    defaultValues: { tokens: "" },
  });

  const [{ data: userConfig }, { data: sessions }, { data: channelData }] =
    useSuspenseQueries({
      queries: [
        $api.queryOptions("get", "/users/config"),
        $api.queryOptions("get", "/users/sessions"),
        $api.queryOptions("get", "/users/channels"),
      ],
    });

  const removeBots = $api.useMutation("delete", "/users/bots", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get", "/users/config"] });
      toast.success("All bots removed");
      setBotOpen(false);
    },
    onError: () => {
      toast.error("Failed to remove bots");
    },
  });

  const handleRemoveBots = useCallback(() => {
    removeBots.mutate({});
  }, []);

  const syncChannels = $api.useMutation("patch", "/users/channels/sync", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get", "/users/channels"] });
      toast.success("Channels Synced");
    },
    onError: async (error) => {
      if (error instanceof NetworkError) {
        const errorData =
          (await error.data?.json()) as components["schemas"]["Error"];
        toast.error(
          `Sync failed: ${errorData.message.split(":").slice(-1)[0]!.trim()}`,
        );
      } else {
        toast.error("Sync failed: An unknown error occurred.");
      }
    },
  });

  const queryClient = useQueryClient();

  const copyTokens = useCallback(() => {
    if (userConfig && userConfig.bots.length > 0) {
      copyDataToClipboard(userConfig.bots).then(() => {
        toast.success("Tokens Copied");
      });
    }
  }, [userConfig?.bots]);

  const botAddition = $api.useMutation("post", "/users/bots", {
    onSuccess: () => {
      toast.success("bots added");
      queryClient.invalidateQueries({ queryKey: ["get", "/users/config"] });
    },
    onError: async (error) => {
      if (error instanceof NetworkError) {
        const errorData =
          (await error.data?.json()) as components["schemas"]["Error"];
        toast.error(errorData.message.split(":").slice(-1)[0]!.trim());
      }
    },
  });

  const updateChannel = $api.useMutation("patch", "/users/channels", {
    onSuccess: () => {
      toast.success("Default channel updated");
      queryClient.invalidateQueries({ queryKey: ["get", "/users/config"] });
    },
    onError: async (error) => {
      if (error instanceof NetworkError) {
        const errorData =
          (await error.data?.json()) as components["schemas"]["Error"];
        toast.error(
          `Failed to update default channel: ${errorData.message.split(":").slice(-1)[0]!.trim()}`,
        );
      } else {
        toast.error(
          "Failed to update default channel: An unknown error occurred.",
        );
      }
    },
  });

  const onSubmit = useCallback(
    async ({ tokens }: { tokens: string }) => {
      botAddition.mutateAsync({
        body: {
          bots: tokens.trim().split("\n"),
        },
      });
    },
    [botAddition],
  );

  const handleSetDefaultChannel = useCallback(
    (channelId: number) => {
      const channel = channelData?.find((c) => c.channelId === channelId);
      if (channel) {
        updateChannel.mutate({
          body: {
            channelId: channel.channelId,
            channelName: channel.channelName,
          },
        });
      }
    },
    [channelData, updateChannel],
  );

  const [botOpen, setBotOpen] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);
  const [channelOperation, setChannelOperation] = useState<"add" | "delete">(
    "add",
  );
  const [channelID, setChannelID] = useState(0);

  return (
    <div
      className={clsx(
        "flex flex-col gap-4 p-4 w-full h-full overflow-y-auto",
        scrollbarClasses,
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-surface rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 border border-outline-variant/50"
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <MaterialSymbolsSmartToy className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold mb-0.5">Manage Bots</h3>
          </div>
        </div>
        <div className="mt-4 space-y-4">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-3"
          >
            <Controller
              name="tokens"
              control={control}
              rules={{ required: true, validate: validateBots }}
              render={({ field, fieldState: { error } }) => (
                <Textarea
                  {...field}
                  disableAutosize
                  classNames={{
                    input: "h-32 min-h-[8rem]",
                    inputWrapper:
                      "bg-surface-container-low data-[hover=true]:bg-surface-container group-data-[focus=true]:bg-surface-container",
                  }}
                  placeholder="Enter tokens 1 per line"
                  autoComplete="off"
                  errorMessage={error ? error.message : ""}
                  isInvalid={!!error}
                />
              )}
            />
            <Button
              isLoading={botAddition.isPending}
              type="submit"
              variant="filledTonal"
              className="self-start"
            >
              Add Bots
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-outline-variant/50">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm font-normal text-on-surface-variant">
                  Active Bots
                </p>
                <p className="text-2xl font-semibold mt-1">
                  {userConfig?.bots.length || 0}
                </p>
              </div>
              <BotOperationModal
                open={botOpen}
                handleClose={() => setBotOpen(false)}
                onRemove={handleRemoveBots}
              />
              <div className="flex gap-2">
                <Button
                  startContent={<IcRoundContentCopy className="size-4" />}
                  variant="filledTonal"
                  className="text-sm"
                  onPress={copyTokens}
                  isDisabled={userConfig?.bots.length === 0}
                >
                  Copy All
                </Button>
                <Button
                  startContent={
                    <IcRoundRemoveCircleOutline className="size-4" />
                  }
                  variant="filledTonal"
                  classNames={{
                    base: "text-sm bg-red-500/20 text-red-500 data-[hover=true]:bg-red-500/30",
                  }}
                  onPress={() => setBotOpen(true)}
                  isDisabled={userConfig?.bots.length === 0}
                >
                  Remove All
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-surface rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 border border-outline-variant/50 flex flex-col gap-4"
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <MaterialSymbolsTv className="size-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Channels</h3>
            </div>
            <p className="text-sm font-normal text-on-surface-variant pl-12">
              Manage available channels
            </p>
          </div>
          <ChannelOperationModal
            open={channelOpen}
            handleClose={() => setChannelOpen(false)}
            operation={channelOperation}
            channelId={channelID}
          />
          <div className="flex gap-2">
            <Button
              isIconOnly
              variant="text"
              title="Add Channel"
              onPress={() => {
                setChannelOperation("add");
                setChannelOpen(true);
              }}
            >
              <AddIcon />
            </Button>
            <Button
              isIconOnly
              variant="text"
              title="Sync Channels"
              isLoading={syncChannels.isPending}
              className={clsx(
                syncChannels.isPending && "pointer-events-none",
                "flex-shrink-0",
              )}
              onPress={() => syncChannels.mutate({})}
            >
              <SyncIcon
                className={clsx(syncChannels.isPending && "animate-spin")}
              />
            </Button>
          </div>
        </div>

        <div>
          {channelData && channelData.length > 0 ? (
            <RadioGroup
              aria-label="Select Default Channel"
              value={userConfig.channelId?.toString() || ""}
              onValueChange={(value) => handleSetDefaultChannel(Number(value))}
              classNames={{ wrapper: "gap-2 max-h-60 overflow-y-auto pr-2" }}
            >
              {channelData.map((channel) => {
                return (
                  <div
                    key={channel.channelId}
                    className="flex justify-between items-center p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors"
                  >
                    <div className="flex-1 flex flex-col">
                      <Radio
                        value={channel.channelId!.toString()}
                        classNames={{ label: "text-base font-medium block" }}
                      >
                        {channel.channelName}
                      </Radio>
                      <p className="text-sm text-on-surface-variant ml-[28px] mt-0.5">
                        ID: {channel.channelId}
                      </p>
                    </div>
                    <Button
                      isIconOnly
                      variant="text"
                      title="Delete Channel"
                      onPress={() => {
                        setChannelOperation("delete");
                        setChannelID(channel.channelId!);
                        setChannelOpen(true);
                      }}
                    >
                      <DeleteIcon />
                    </Button>
                  </div>
                );
              })}
            </RadioGroup>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-on-surface-variant">
                No channels found. Press the sync button to fetch your channels
                from Telegram.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-surface rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 border border-outline-variant/50"
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <IcRoundSecurity className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold mb-0.5">Active Sessions</h3>
            <p className="text-sm text-on-surface-variant">
              Manage active sessions for your account.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3 mt-4 justify-items-start">
          {sessions?.map((session) => (
            <Session key={session.hash} {...session} />
          ))}
        </div>
      </motion.div>
    </div>
  );
});
