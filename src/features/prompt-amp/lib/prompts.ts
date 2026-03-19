interface Message {
  role: 'system' | 'user'
  content: string
}

export function buildRound1Prompt(roughPrompt: string): Message[] {
  return [
    {
      role: 'system',
      content: `You are a prompt engineering expert. The user will give you a rough idea or prompt.
Your task is to analyze it and identify what's missing or ambiguous.

Output a structured analysis in the following format (use Chinese):

## 意图理解
简要描述你对用户需求的理解。

## 缺失维度
列出用户没有明确但对高质量输出至关重要的维度，例如：
- 目标受众
- 输出格式/长度
- 风格/语气
- 技术约束
- 边界条件
- 成功标准

## 关键假设
列出你会做出的合理假设，让用户确认或修改。

Be thorough but concise. Focus on what matters most for producing a high-quality one-shot result.`,
    },
    {
      role: 'user',
      content: roughPrompt,
    },
  ]
}

export function buildRound2Prompt(roughPrompt: string, round1Analysis: string): Message[] {
  return [
    {
      role: 'system',
      content: `You are a prompt engineering expert. Based on the original rough prompt and the analysis from the previous round, generate a comprehensive, structured specification prompt.

Output MUST use the following markdown section format (use Chinese). Each section starts with ## heading:

## 目标
明确描述最终产出物是什么，解决什么问题。

## 目标受众
描述输出面向谁，他们的背景和期望。

## 功能需求
详细列出必须满足的功能点。

## 约束条件
技术限制、格式要求、长度限制等。

## 风格与语气
输出的风格、语气、表达方式。

## 边界条件与异常处理
需要考虑的边界情况和特殊场景。

## 验收标准
如何判断输出是否满意。

## 参考示例
如果合适，给出简短的期望输出示例或方向描述。

Each section should be detailed enough that an AI can produce the desired output in a single attempt. Do not be vague — be specific and actionable.`,
    },
    {
      role: 'user',
      content: `原始需求：\n${roughPrompt}\n\n分析结果：\n${round1Analysis}`,
    },
  ]
}

export function buildRound3Prompt(round2Spec: string): Message[] {
  return [
    {
      role: 'system',
      content: `You are a prompt quality reviewer. Review the following structured specification prompt and improve it.

Your tasks:
1. Find any gaps, contradictions, or vague parts
2. Sharpen language to be more specific and actionable
3. Add any missing details that would help produce a perfect one-shot output
4. Ensure all sections are internally consistent

Output the IMPROVED version using the exact same ## section format. Keep all existing section headings. You may add content but do not remove sections. Use Chinese.

IMPORTANT: Output ONLY the improved sections, no preamble or commentary.`,
    },
    {
      role: 'user',
      content: round2Spec,
    },
  ]
}
