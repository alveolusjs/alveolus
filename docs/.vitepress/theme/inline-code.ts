export function inlineCode(text: string): string {
	const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

	return escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
}
