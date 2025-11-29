export function parseMarkdown(text: string): string {
  let result = text;
  
  // Remove markdown syntax
  result = result.replace(/^### (.+)$/gm, '$1');
  result = result.replace(/^## (.+)$/gm, '$1');
  result = result.replace(/^# (.+)$/gm, '$1');
  result = result.replace(/\*\*(.+?)\*\*/g, '$1');
  result = result.replace(/^[-*] (.+)$/gm, '• $1');
  result = result.replace(/^\d+\. (.+)$/gm, '$1');
  
  return result;
}
