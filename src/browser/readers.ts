import { mergeObjects } from "../core/readers";
import type { Parser } from "../types/parsers";
import type { DataContext, FileReaderParameters } from "../types/readers";

export const fileReader = async (
	{ resource, encoding, errorHandler }: FileReaderParameters,
	parser: Parser,
	_?: DataContext,
): Promise<object> => {
	if (!resource.isFileResource()) {
		throw new TypeError("fileReader requires a file-based resource");
	}

	const files = resource.files;
	if (!files || files.length === 0) {
		throw new TypeError("No files available to read");
	}

	const results: object[] = [];
	let firstError: Error | null = null;

	// Read and parse each file individually
	for (const file of files) {
		let content: string;
		let parsed: any;

		// Step 1: Read file content
		try {
			content = await new Promise<string>((resolve, reject) => {
				const reader = new FileReader();

				reader.onload = (e: ProgressEvent<FileReader>) => {
					if (typeof e?.target?.result === "string") {
						resolve(e.target.result);
					} else {
						reject(new Error("FileReader did not return a string result."));
					}
				};

				reader.onerror = () => {
					reject(reader.error || new Error("FileReader error occurred"));
				};

				reader.readAsText(file, encoding ?? "utf-8");
			});
		} catch (error) {
			const readError = new Error(
				`Failed to read file ${file.name}: ${error instanceof Error ? error.message : String(error)}`,
			);

			if (resource.strict && !firstError) {
				firstError = readError;
			}

			if (errorHandler) {
				errorHandler(readError, resource.strict);
			} else {
				console.error(`FileReader error:`, readError.message);
			}

			if (firstError) {
				throw firstError;
			}
			continue; // Skip to next file
		}

		// Step 2: Parse content
		try {
			parsed = await parser(content);
		} catch (error) {
			const parseError = new Error(
				`Failed to parse file ${file.name}: ${error instanceof Error ? error.message : String(error)}`,
			);

			if (resource.strict && !firstError) {
				firstError = parseError;
			}

			if (errorHandler) {
				errorHandler(parseError, resource.strict);
			} else {
				console.error(`Parser error:`, parseError.message);
			}

			if (firstError) {
				throw firstError;
			}
			continue; // Skip to next file
		}

		// Step 3: Combine based on output strategy
		if (resource.output === "array") {
			if (Array.isArray(parsed)) {
				results.push(...parsed);
			} else {
				results.push(parsed);
			}
		} else if (resource.output === "object") {
			results.push(parsed);
		} else {
			results.push(parsed);
		}
	}

	if (resource.output === "object") {
		return mergeObjects(results);
	} else if (resource.output === "array") {
		return results;
	} else {
		return results.length === 1 ? results[0] : results;
	}
};
