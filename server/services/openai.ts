import OpenAI from "openai";
import { type ConversationMessage, type ResponseOption, type ConversationOutcome, type Scenario } from "@shared/schema";

// Using GPT-4o as requested by user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "your-api-key-here"
});

export class ConversationAI {
  
  async generateInitialMessage(scenario: Scenario): Promise<string> {
    try {
      const characterTraits = scenario.characterProfile.join(', ');
      const situationContext = `
Core Issue: ${scenario.coreIssue}
Your Stance: ${scenario.otherStance}
User's Stance: ${scenario.userStance}
Relationship: ${scenario.relationship}${scenario.backgroundStory ? `\nBackground: ${scenario.backgroundStory}` : ''}`;

      const prompt = `CRITICAL: You are roleplaying as a specific character. You are NOT the user. You are the OTHER person in this conversation.

CHARACTER TRAITS YOU ARE PLAYING: ${characterTraits}
SITUATION: ${situationContext}
THE USER'S GOAL (not yours): ${scenario.goal}
CONVERSATION PURPOSE: ${scenario.purpose}

REMEMBER:
- YOU are the character with these traits: ${characterTraits}
- Your relationship with the user is: ${scenario.relationship}
- The USER is someone else trying to achieve their goal
- NEVER speak as the user or adopt their perspective
- Stay true to your character's personality, motivations, and interests
- Your stance on the issue is: ${scenario.otherStance}

As this specific character, start the conversation naturally based on the situation. The user wants to practice this conversation with you, so be realistic and stay in character. Respond as the character would in this situation.

IMPORTANT: Keep your response to a MAXIMUM of 30 words.

Return only the character's opening message, no additional formatting.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
      });

      return response.choices[0].message.content || "Hello, let's discuss this matter.";
    } catch (error) {
      console.error('OpenAI API Error in generateInitialMessage:', error);
      throw new Error(`Failed to generate initial message: ${(error as Error).message}`);
    }
  }

  async generateResponseOptions(
    scenario: Scenario, 
    conversationHistory: ConversationMessage[]
  ): Promise<ResponseOption[]> {
    const historyText = conversationHistory
      .map(msg => `${msg.type.toUpperCase()}: ${msg.content}`)
      .join('\n');
    
    const characterTraits = scenario.characterProfile.join(', ');
    const situationContext = `
Core Issue: ${scenario.coreIssue}
User's Stance: ${scenario.userStance}
Other Person's Stance: ${scenario.otherStance}
Relationship: ${scenario.relationship}${scenario.backgroundStory ? `\nBackground: ${scenario.backgroundStory}` : ''}`;

    const prompt = `You are helping a user practice a conversation simulation.

Scenario Context:
- Purpose: ${scenario.purpose}
- Character Traits: ${characterTraits}
- Situation: ${situationContext}
- User's Goal: ${scenario.goal}

Conversation History:
${historyText}

Generate 3 distinctly different response options that create varied conversation dynamics and outcomes:

1. **Approach 1** - Collaborative, seeks compromise and mutual understanding. This approach should lead toward RESOLUTION and finding middle ground.

2. **Approach 2** - Direct, firm, potentially confrontational. This approach should escalate the situation or create TENSION/DISPUTE, making the conversation more challenging.

3. **Approach 3** - Calculated, focused on specific goals, may involve ultimatums or walking away. This approach should create CLEAR CONSEQUENCES or DECISIVE ACTIONS that change the conversation's direction.

Each response must create a DIFFERENT conversation trajectory - one toward resolution, one toward conflict, one toward decisive action/conclusion.

CRITICAL REQUIREMENT: Each response option MUST be exactly 20-30 words maximum. Count the words carefully. If any response exceeds 30 words, it will be rejected. Be extremely concise and impactful.

Return as JSON in this exact format:
{
  "approach1": {
    "content": "the approach 1 response text that seeks compromise",
    "description": "Seeks resolution"
  },
  "approach2": {
    "content": "the approach 2 response text that creates tension", 
    "description": "Creates conflict"
  },
  "approach3": {
    "content": "the approach 3 response text with clear consequences",
    "description": "Decisive action"
  }
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 600,
    });

    const options = JSON.parse(response.choices[0].message.content || "{}");
    
    return [
      { approach: 'approach1', content: options.approach1?.content || "", description: options.approach1?.description || "Seeks resolution" },
      { approach: 'approach2', content: options.approach2?.content || "", description: options.approach2?.description || "Creates conflict" },
      { approach: 'approach3', content: options.approach3?.content || "", description: options.approach3?.description || "Decisive action" }
    ];
  }

  async generateAIResponse(
    scenario: Scenario,
    conversationHistory: ConversationMessage[],
    userApproach: string
  ): Promise<string> {
    const historyText = conversationHistory
      .map(msg => `${msg.type.toUpperCase()}: ${msg.content}`)
      .join('\n');

    const exchangeCount = conversationHistory.length;
    const shouldConsiderEnding = exchangeCount >= 24; // Start considering ending after 12 full exchanges
    
    const characterTraits = scenario.characterProfile.join(', ');
    const situationContext = `
Core Issue: ${scenario.coreIssue}
Your Stance: ${scenario.otherStance}
User's Stance: ${scenario.userStance}
Relationship: ${scenario.relationship}${scenario.backgroundStory ? `\nBackground: ${scenario.backgroundStory}` : ''}`;

    const prompt = `CRITICAL: You are roleplaying as a specific character. You are NOT the user. You are the OTHER person in this conversation.

CHARACTER TRAITS YOU ARE PLAYING: ${characterTraits}
SITUATION: ${situationContext}
THE USER'S GOAL (not yours): ${scenario.goal}
CONVERSATION PURPOSE: ${scenario.purpose}
Current Exchange: ${Math.ceil(exchangeCount / 2)} of maximum 15

Conversation History:
${historyText}

REMEMBER: 
- YOU are the character with these traits: ${characterTraits}
- Your relationship with the user is: ${scenario.relationship}
- The USER is the other person trying to achieve their goal
- NEVER speak as if you are the user
- NEVER adopt the user's perspective or goals as your own
- Stay consistent with your character's personality and motivations
- Your stance on the issue is: ${scenario.otherStance}

The user just responded using a ${userApproach} approach. As the CHARACTER (not as the user), respond naturally to their message.

REACTION GUIDELINES:
- If they used APPROACH 1: Show openness to compromise but maintain your character's core interests. Move toward finding middle ground.
- If they used APPROACH 2: React with matching energy - show resistance, pushback, or escalation based on your character. Create tension.
- If they used APPROACH 3: Respond to their calculated move with your own strategic consideration. This might lead to acceptance, counter-offers, or walking away.

${shouldConsiderEnding ? 'CRITICAL: You are in the later stages of this conversation. Strongly consider if this topic has been sufficiently discussed. If the main points have been covered or if there is little substance left to discuss, you should naturally conclude the conversation with a definitive statement, agreement, disagreement, or decision. Do not artificially extend the conversation.' : 'The conversation is still developing - engage meaningfully with their response.'}

IMPORTANT: Keep your response to a MAXIMUM of 30 words.

Respond ONLY as the character (not the user), no additional formatting.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
    });

    return response.choices[0].message.content || "I understand your perspective.";
  }

  async shouldEndConversation(
    scenario: Scenario,
    conversationHistory: ConversationMessage[],
    exchangeCount: number
  ): Promise<{ shouldEnd: boolean; reason: string }> {
    if (exchangeCount < 3) return { shouldEnd: false, reason: "Too early" }; // Never end before 3 exchanges

    const historyText = conversationHistory
      .map(msg => `${msg.type.toUpperCase()}: ${msg.content}`)
      .join('\n');
    
    const characterTraits = scenario.characterProfile.join(', ');
    const situationContext = `
Core Issue: ${scenario.coreIssue}
User's Stance: ${scenario.userStance}
Other Person's Stance: ${scenario.otherStance}
Relationship: ${scenario.relationship}${scenario.backgroundStory ? `\nBackground: ${scenario.backgroundStory}` : ''}`;

    const prompt = `Analyze this conversation to determine if it should naturally conclude.

Scenario Context:
- Purpose: ${scenario.purpose}
- Character Traits: ${characterTraits}
- Situation: ${situationContext}
- User's Goal: ${scenario.goal}

Conversation History (Exchange ${exchangeCount} of max 15):
${historyText}

Determine if this conversation has reached a natural conclusion point. A conversation should end if:
1. The main topic has been sufficiently discussed
2. The character has made a clear final decision/position
3. Both parties have expressed their views and there's little more to add
4. An agreement, disagreement, or resolution has been reached
5. The conversation is becoming repetitive or unproductive

A conversation should NOT end if:
- There are still important points to discuss
- The character would realistically continue engaging
- The user's goal could still be meaningfully pursued

Return JSON in this exact format:
{
  "shouldEnd": boolean,
  "reason": "brief explanation of why it should/shouldn't end"
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 200,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"shouldEnd": false, "reason": "Analysis failed"}');
      return {
        shouldEnd: result.shouldEnd || false,
        reason: result.reason || "Analysis unavailable"
      };
    } catch (error) {
      console.error('Error in shouldEndConversation:', error);
      return { shouldEnd: false, reason: "Error in analysis" };
    }
  }

  async evaluateConversationOutcome(
    scenario: Scenario,
    conversationHistory: ConversationMessage[]
  ): Promise<ConversationOutcome> {
    const historyText = conversationHistory
      .map(msg => `${msg.type.toUpperCase()}: ${msg.content}`)
      .join('\n');
    
    const characterTraits = scenario.characterProfile.join(', ');
    const situationContext = `
Core Issue: ${scenario.coreIssue}
User's Stance: ${scenario.userStance}
Other Person's Stance: ${scenario.otherStance}
Relationship: ${scenario.relationship}${scenario.backgroundStory ? `\nBackground: ${scenario.backgroundStory}` : ''}`;

    const prompt = `Analyze this conversation simulation and provide an evaluation.

Original Goal: ${scenario.goal}
Purpose: ${scenario.purpose}
Character Traits: ${characterTraits}
Situation: ${situationContext}

Full Conversation:
${historyText}

Evaluate how well the user achieved their stated goal and provide insights. Return as JSON in this exact format:
{
  "goalAchieved": boolean,
  "goalPercentage": number (0-100),
  "communicationAnalysis": "brief analysis of communication effectiveness",
  "keyInsights": ["insight 1", "insight 2", "insight 3"],
  "alternativePaths": [
    {"approach": "approach name", "description": "what this approach would achieve"}
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 800,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      goalAchieved: result.goalAchieved || false,
      goalPercentage: result.goalPercentage || 0,
      communicationAnalysis: result.communicationAnalysis || "Analysis unavailable",
      keyInsights: result.keyInsights || [],
      alternativePaths: result.alternativePaths || []
    };
  }
}

export const conversationAI = new ConversationAI();
