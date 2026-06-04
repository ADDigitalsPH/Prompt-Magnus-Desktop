export type PromptVariableValues = Record<string, string>;

const variablePattern = /\{([a-zA-Z][a-zA-Z0-9_-]{0,39})\}/g;

export function extractPromptVariables(body: string) {
  const variables = new Set<string>();
  for (const match of body.matchAll(variablePattern)) {
    variables.add(match[1]);
  }

  return Array.from(variables);
}

export function hasPromptVariables(body: string) {
  return extractPromptVariables(body).length > 0;
}

export function applyPromptVariables(body: string, values: PromptVariableValues) {
  return body.replace(variablePattern, (match, name: string) => values[name] ?? match);
}

export function formatVariableName(name: string) {
  return name
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
