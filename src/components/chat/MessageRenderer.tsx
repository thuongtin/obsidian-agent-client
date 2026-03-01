import { setIcon } from "obsidian";
import * as React from "react";
import type { IAcpClient } from "../../adapters/acp/acp.adapter";
import type {
	ChatMessage,
	MessageContent,
} from "../../domain/models/chat-message";
import type AgentClientPlugin from "../../plugin";
import { MessageContentRenderer } from "./MessageContentRenderer";

export interface MessageRendererProps {
	message: ChatMessage;
	plugin: AgentClientPlugin;
	acpClient?: IAcpClient;
	/** Callback to approve a permission request */
	onApprovePermission?: (requestId: string, optionId: string) => Promise<void>;
	onDeleteMessage?: (messageId: string) => void;
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

function extractTextContent(message: ChatMessage): string {
	return message.content
		.filter((c) => c.type === "text" || c.type === "text_with_context")
		.map((c) => (c as any).text || "")
		.join("\n");
}
function createGroupKey(id: string, idx: number) {
	return `grp-${id}-${idx}`;
}

function createItemKey(id: string, idx: number, sub: number) {
	return `itm-${id}-${idx}-${sub}`;
}

export function MessageRenderer({
	message,
	plugin,
	acpClient,
	onApprovePermission,
	onDeleteMessage,
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
						<div
							key={createGroupKey(message.id, idx)}
							className="agent-client-message-images-strip"
						>
							{group.items.map((content, imgIdx) => (
								<React.Fragment key={createItemKey(message.id, idx, imgIdx)}>
									<MessageContentRenderer
										content={content}
										plugin={plugin}
										messageId={message.id}
										messageRole={message.role}
										acpClient={acpClient}
										onApprovePermission={onApprovePermission}
									/>
								</React.Fragment>
							))}
						</div>
					);
				} else {
					// Render single non-image content
					return (
						<div key={createGroupKey(message.id, idx)}>
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

			{/* Action Toolbar */}
			<div className="agent-client-message-toolbar">
				<div className="agent-client-message-actions">
					<button
						type="button"
						className="agent-client-action-button"
						title="Copy"
						onClick={async () => {
							const text = extractTextContent(message);
							await navigator.clipboard.writeText(text);
						}}
						ref={(el) => {
							if (el) setIcon(el, "copy");
						}}
					/>

					{onDeleteMessage && (
						<button
							type="button"
							className="agent-client-action-button agent-client-action-danger"
							title="Delete"
							onClick={() => onDeleteMessage(message.id)}
							ref={(el) => {
								if (el) setIcon(el, "trash-2");
							}}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
