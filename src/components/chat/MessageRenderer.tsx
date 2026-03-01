import { setIcon } from "obsidian";
import * as React from "react";
import type { IAcpClient } from "../../adapters/acp/acp.adapter";
import type {
	ChatMessage,
	MessageContent,
} from "../../domain/models/chat-message";
import type AgentClientPlugin from "../../plugin";
import { MessageContentRenderer } from "./MessageContentRenderer";

interface MessageRendererProps {
	message: ChatMessage;
	plugin: AgentClientPlugin;
	acpClient?: IAcpClient;
	/** Callback to approve a permission request */
	onApprovePermission?: (requestId: string, optionId: string) => Promise<void>;
}

/**
 * Group consecutive image contents together for horizontal scrolling display.
 * Non-image contents are wrapped individually.
 */
function groupContent(
	contents: MessageContent[],
): Array<
	| { type: "images"; items: MessageContent[] }
	| { type: "single"; item: MessageContent }
> {
	const groups: Array<
		| { type: "images"; items: MessageContent[] }
		| { type: "single"; item: MessageContent }
	> = [];

	let currentImageGroup: MessageContent[] = [];

	for (const content of contents) {
		if (content.type === "image") {
			currentImageGroup.push(content);
		} else {
			// Flush any pending image group
			if (currentImageGroup.length > 0) {
				groups.push({ type: "images", items: currentImageGroup });
				currentImageGroup = [];
			}
			groups.push({ type: "single", item: content });
		}
	}

	// Flush remaining images
	if (currentImageGroup.length > 0) {
		groups.push({ type: "images", items: currentImageGroup });
	}

	return groups;
}

export function MessageRenderer({
	message,
	plugin,
	acpClient,
	onApprovePermission,
}: MessageRendererProps) {
	const groups = groupContent(message.content);

	return (
		<div
			className={`agent-client-message-renderer ${message.role === "user" ? "agent-client-message-user" : "agent-client-message-assistant"}`}
		>
			{groups.map((group, idx) => {
				if (group.type === "images") {
					// Render images in horizontal scroll container
					return (
						<div key={idx} className="agent-client-message-images-strip">
							{group.items.map((content, imgIdx) => (
								<MessageContentRenderer
									key={imgIdx}
									content={content}
									plugin={plugin}
									messageId={message.id}
									messageRole={message.role}
									acpClient={acpClient}
									onApprovePermission={onApprovePermission}
								/>
							))}
						</div>
					);
				} else {
					// Render single non-image content
					return (
						<div key={idx}>
							<MessageContentRenderer
								content={group.item}
								plugin={plugin}
								messageId={message.id}
								messageRole={message.role}
								acpClient={acpClient}
								onApprovePermission={onApprovePermission}
							/>
						</div>
					);
				}
			})}
			{message.role === "user" &&
				message.status &&
				message.status !== "sent" && (
					<div
						className={`agent-client-message-status agent-client-message-status-${message.status}`}
						style={{
							display: "flex",
							justifyContent: "flex-end",
							opacity: 0.6,
							marginTop: "4px",
							fontSize: "0.8em",
						}}
					>
						{message.status === "queued" && (
							<span
								style={{
									display: "flex",
									alignItems: "center",
									gap: "4px",
								}}
							>
								<span
									ref={(el) => {
										if (el) setIcon(el, "clock");
									}}
								/>{" "}
								Queued
							</span>
						)}
						{message.status === "sending" && (
							<span
								style={{
									display: "flex",
									alignItems: "center",
									gap: "4px",
								}}
							>
								<span
									ref={(el) => {
										if (el) setIcon(el, "loader");
									}}
									className="agent-client-spin"
								/>{" "}
								Sending...
							</span>
						)}
						{message.status === "error" && (
							<span
								style={{
									display: "flex",
									alignItems: "center",
									gap: "4px",
									color: "var(--text-error)",
								}}
							>
								<span
									ref={(el) => {
										if (el) setIcon(el, "alert-circle");
									}}
								/>{" "}
								Failed
							</span>
						)}
					</div>
				)}
		</div>
	);
}
