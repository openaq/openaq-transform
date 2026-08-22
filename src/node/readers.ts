import { readFile } from "node:fs/promises";
import type {
	DataContext,
	FileSystemReaderParameters,
	ResourceData,
	SourceRecord,
	StringParser,
} from "@openaq/transform/core";

export const fileSystemReader = async (
	{ resource, encoding }: FileSystemReaderParameters,
	parser: StringParser,
	_?: DataContext,
): Promise<ResourceData | SourceRecord[]> => {
	if (!resource.isUrlResource()) {
		throw new TypeError("fileSystemReader requires a URL-based resource");
	}

	const parserOptions = resource.parserOptions;

	const results = await Promise.all(
		resource.urls.map(({ url }) => {
			const path = url.startsWith("file://") ? new URL(url) : url;
			const data = readFile(path, { encoding: encoding ?? "utf8" });
			return data.toString();
		}),
	);

	const content = results.join("\n");
	const result: unknown = await parser(content, parserOptions);

	if (!result || typeof result !== "object") {
		throw new Error("Parser returned a non-object value");
	}

	return result as ResourceData | SourceRecord[];
};
