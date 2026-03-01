import { exec } from "child_process";
import { Platform } from "obsidian";
import { promisify } from "util";
import type { Logger } from "./logger";

const execAsync = promisify(exec);

export async function extractShellEnvironment(
	logger: Logger,
): Promise<NodeJS.ProcessEnv | null> {
	if (!Platform.isMacOS && !Platform.isLinux) {
		return null; // Only applicable for Unix-like systems needing login shell extraction
	}

	try {
		logger.log("[EnvExtractor] Fetching shell environment...");

		// Attempt to get the user's default shell
		const shell = process.env.SHELL || "/bin/zsh";

		// Execute the 'env' command inside a login shell to force profile sourcing
		const { stdout, stderr } = await execAsync(`"${shell}" -lc "env"`, {
			timeout: 5000, // 5 second timeout to prevent hanging UI
		});

		if (stderr && stderr.trim().length > 0) {
			logger.log("[EnvExtractor] Warnings during env extraction:", stderr);
		}

		const envLines = stdout.split("\n");
		const extractedEnv: NodeJS.ProcessEnv = {};

		for (const line of envLines) {
			const match = line.match(/^([^=]+)=(.*)$/);
			if (match) {
				const key = match[1];
				const value = match[2];
				// Skip special bash/zsh functions or multi-line weirdness starting with whitespace
				if (key && !key.startsWith(" ") && !key.startsWith("\t")) {
					extractedEnv[key] = value;
				}
			}
		}

		logger.log(
			"[EnvExtractor] Successfully extracted environment variables:",
			Object.keys(extractedEnv).length,
			"keys.",
		);
		return extractedEnv;
	} catch (error) {
		logger.error("[EnvExtractor] Failed to extract shell environment:", error);
		return null; // Fallback safely
	}
}
