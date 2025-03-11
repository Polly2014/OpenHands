import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import React, { JSX } from "react";
import posthog from "posthog-js";
import { useParams } from "react-router";
import { convertImageToBase64 } from "#/utils/convert-image-to-base-64";
import { TrajectoryActions } from "../trajectory/trajectory-actions";
import { createChatMessage } from "#/services/chat-service";
import { InteractiveChatBox } from "./interactive-chat-box";
import { addUserMessage } from "#/state/chat-slice";
import { RootState } from "#/store";
import { AgentState } from "#/types/agent-state";
import { generateAgentStateChangeEvent } from "#/services/agent-state-service";
import { FeedbackModal } from "../feedback/feedback-modal";
import { useScrollToBottom } from "#/hooks/use-scroll-to-bottom";
import { TypingIndicator } from "./typing-indicator";
import { useWsClient } from "#/context/ws-client-provider";
import { Messages } from "./messages";
import { ChatSuggestions } from "./chat-suggestions";
import { ActionSuggestions } from "./action-suggestions";
import { ContinueButton } from "#/components/shared/buttons/continue-button";
import { ScrollToBottomButton } from "#/components/shared/buttons/scroll-to-bottom-button";
import { LoadingSpinner } from "#/components/shared/loading-spinner";
import { useGetTrajectory } from "#/hooks/mutation/use-get-trajectory";
import { downloadTrajectory } from "#/utils/download-files";
import { AllHandsLogoButton } from "#/components/shared/buttons/all-hands-logo-button";
import { ExitProjectButton } from "#/components/shared/buttons/exit-project-button";
import { TooltipButton } from "#/components/shared/buttons/tooltip-button";
import { FaListUl } from "react-icons/fa";
import { ConversationPanelWrapper } from "../conversation-panel/conversation-panel-wrapper";
import { ConversationPanel } from "../conversation-panel/conversation-panel";
import { setCurrentAgentState } from "#/state/agent-slice";
import { useEndSession } from "#/hooks/use-end-session";
import { cn } from "#/utils/utils";
import { AgentControlBar } from "../controls/agent-control-bar";
import { AgentStatusBar } from "../controls/agent-status-bar";
import { Collapse } from "#/components/layout/resizable-panel";

function getEntryPoint(
  hasRepository: boolean | null,
  hasImportedProjectZip: boolean | null,
): string {
  if (hasRepository) return "github";
  if (hasImportedProjectZip) return "zip";
  return "direct";
}

type ChatInterfaceProps = {
  collapse?: Collapse;
  collapseButton?: React.ReactNode;
  expandButton?: React.ReactNode;
};

export function ChatInterface({collapse, collapseButton, expandButton}:ChatInterfaceProps ): JSX.Element {
  const { send, isLoadingMessages } = useWsClient();
  const dispatch = useDispatch();
  const endSession = useEndSession();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { scrollDomToBottom, onChatBodyScroll, hitBottom } =
    useScrollToBottom(scrollRef);

  const [conversationPanelIsOpen, setConversationPanelIsOpen] =
    React.useState(false);
  const { messages } = useSelector((state: RootState) => state.chat);
  const { curAgentState } = useSelector((state: RootState) => state.agent);

  const [feedbackPolarity, setFeedbackPolarity] = React.useState<
    "positive" | "negative"
  >("positive");
  const [feedbackModalIsOpen, setFeedbackModalIsOpen] = React.useState(false);
  const [messageToSend, setMessageToSend] = React.useState<string | null>(null);
  const { selectedRepository, importedProjectZip } = useSelector(
    (state: RootState) => state.initialQuery,
  );
  const params = useParams();
  const { mutate: getTrajectory } = useGetTrajectory();

  const handleSendMessage = async (content: string, files: File[]) => {
    if (messages.length === 0) {
      posthog.capture("initial_query_submitted", {
        entry_point: getEntryPoint(
          selectedRepository !== null,
          importedProjectZip !== null,
        ),
        query_character_length: content.length,
        uploaded_zip_size: importedProjectZip?.length,
      });
    } else {
      posthog.capture("user_message_sent", {
        session_message_count: messages.length,
        current_message_length: content.length,
      });
    }
    const promises = files.map((file) => convertImageToBase64(file));
    const imageUrls = await Promise.all(promises);

    const timestamp = new Date().toISOString();
    const pending = true;
    dispatch(addUserMessage({ content, imageUrls, timestamp, pending }));
    send(createChatMessage(content, imageUrls, timestamp));
    setMessageToSend(null);
  };

  const handleStop = () => {
    posthog.capture("stop_button_clicked");
    send(generateAgentStateChangeEvent(AgentState.STOPPED));
  };

  const handleSendContinueMsg = () => {
    handleSendMessage("Continue", []);
  };

  const onClickShareFeedbackActionButton = async (
    polarity: "positive" | "negative",
  ) => {
    setFeedbackModalIsOpen(true);
    setFeedbackPolarity(polarity);
  };

  const onClickExportTrajectoryButton = () => {
    if (!params.conversationId) {
      toast.error("ConversationId unknown, cannot download trajectory");
      return;
    }

    getTrajectory(params.conversationId, {
      onSuccess: async (data) => {
        await downloadTrajectory(
          params.conversationId ?? "unknown",
          data.trajectory,
        );
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  const handleEndSession = () => {
    dispatch(setCurrentAgentState(AgentState.LOADING));
    endSession();
  };

  const isWaitingForUserInput =
    curAgentState === AgentState.AWAITING_USER_INPUT ||
    curAgentState === AgentState.FINISHED;

    if (collapse !== Collapse.COLLAPSED ) {
      return (
        <div className="h-full flex flex-col justify-between">
          <nav className="flex flex-row md:flex-row items-center justify-between w-full h-auto md:w-auto gap-[26px] p-3">
            <div className="flex flex-row md:flex-row items-center gap-[20px]">
              <div className="flex items-center justify-center">
                <AllHandsLogoButton onClick={handleEndSession} />
              </div>
              <ExitProjectButton onClick={handleEndSession} />
              <TooltipButton
                testId="toggle-conversation-panel"
                tooltip="Conversations"
                ariaLabel="Conversations"
                onClick={() => setConversationPanelIsOpen((prev) => !prev)}
              >
                <FaListUl
                  size={22}
                  className={cn(
                    conversationPanelIsOpen ? "text-white" : "text-[#9099AC]",
                  )}
                />
              </TooltipButton>
            </div>
            <div className="flex gap-[20px]">
              <TrajectoryActions onExportTrajectory={() => onClickExportTrajectoryButton()} />
              {collapseButton && <div style={{top: "4px"}}>{collapseButton}</div>}
            </div>
          </nav>
          {conversationPanelIsOpen && (
            <ConversationPanelWrapper isOpen={conversationPanelIsOpen}>
              <ConversationPanel
                onClose={() => setConversationPanelIsOpen(false)}
              />
            </ConversationPanelWrapper>
          )}
      {messages.length === 0 && (
        <ChatSuggestions onSuggestionsClick={setMessageToSend} />
      )}

      <div
        ref={scrollRef}
        onScroll={(e) => onChatBodyScroll(e.currentTarget)}
        className="flex flex-col grow overflow-y-auto overflow-x-hidden px-4 pt-4 gap-2"
      >
        {isLoadingMessages && (
          <div className="flex justify-center">
            <LoadingSpinner size="small" />
          </div>
        )}

        {!isLoadingMessages && (
          <Messages
            messages={messages}
            isAwaitingUserConfirmation={
              curAgentState === AgentState.AWAITING_USER_CONFIRMATION
            }
          />
        )}

        {isWaitingForUserInput && (
          <ActionSuggestions
            onSuggestionsClick={(value) => handleSendMessage(value, [])}
          />
        )}
      </div>

      <div className="flex flex-col gap-[6px] px-4 pb-4">
        <div className="flex justify-between relative">
        <div className="flex items-center gap-2">
          <AgentControlBar />
          <AgentStatusBar />
        </div>

          <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0">
            {messages.length > 2 &&
              curAgentState === AgentState.AWAITING_USER_INPUT && (
                <ContinueButton onClick={handleSendContinueMsg} />
              )}
            {curAgentState === AgentState.RUNNING && <TypingIndicator />}
          </div>

          {!hitBottom && <ScrollToBottomButton onClick={scrollDomToBottom} />}
        </div>

        <InteractiveChatBox
          onSubmit={handleSendMessage}
          onStop={handleStop}
          isDisabled={
            curAgentState === AgentState.LOADING ||
            curAgentState === AgentState.AWAITING_USER_CONFIRMATION
          }
          mode={curAgentState === AgentState.RUNNING ? "stop" : "submit"}
          value={messageToSend ?? undefined}
          onChange={setMessageToSend}
        />
      </div>

      <FeedbackModal
        isOpen={feedbackModalIsOpen}
        onClose={() => setFeedbackModalIsOpen(false)}
        polarity={feedbackPolarity}
      />
    </div>
  );
  } else {
    return (
      <div className="h-full flex flex-col justify-between">
      <nav className="flex flex-row md:flex-row items-center justify-between w-full h-auto md:w-auto p-3">
        {expandButton && expandButton}
      </nav></div>)

  }
}
