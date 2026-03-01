import * as React from "react";

const { useState, useEffect, useRef } = React;

import { setIcon } from "obsidian";

import type AgentClientPlugin from "../../plugin";
import { MarkdownTextRenderer } from "./MarkdownTextRenderer";

interface CollapsibleThoughtProps {
	text: string;
	plugin: AgentClientPlugin;
}

export function CollapsibleThought({ text, plugin }: CollapsibleThoughtProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const showEmojis = plugin.settings.displaySettings.showEmojis;

	const brainIconRef = useRef<HTMLSpanElement>(null);
	const chevronIconRef = useRef<HTMLSpanElement>(null);

	// Set icons
	useEffect(() => {
		if (brainIconRef.current) {
			setIcon(brainIconRef.current, "brain");
		}
	}, []);

	useEffect(() => {
		if (chevronIconRef.current) {
			setIcon(
				chevronIconRef.current,
				isExpanded ? "chevron-down" : "chevron-right",
			);
		}
	}, [isExpanded]);

	return (
		<div className="agent-client-collapsible-thought">
			<div
				className="agent-client-collapsible-thought-header"
				onClick={() => setIsExpanded(!isExpanded)}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						setIsExpanded(!isExpanded);
					}
				}}
				tabIndex={0}
				role="button"
				aria-expanded={isExpanded}
			>
				<span className="agent-client-collapsible-thought-title">
					{showEmojis ? (
						"💡 Thinking"
					) : (
						<>
							<span
								ref={brainIconRef}
								className="agent-client-collapsible-thought-icon-brain"
							/>
							Thinking
						</>
					)}
				</span>
				<span
					ref={chevronIconRef}
					className="agent-client-collapsible-thought-icon"
				/>
			</div>
			{isExpanded && (
				<div className="agent-client-collapsible-thought-content">
					<MarkdownTextRenderer text={text} plugin={plugin} />
				</div>
			)}
		</div>
	);
}
