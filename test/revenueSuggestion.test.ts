// test/revenueSuggestion.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runRevenueSuggestion } from '../src/workers/revenueSuggestion';

// Mock the ChatOpenAI class from @langchain/openai
vi.mock('@langchain/openai', () => {
  const invokeMock = vi.fn().mockResolvedValue({
    content: 'Mocked revenue suggestion output',
  });
  class MockChatOpenAI {
    invoke = invokeMock;
    call = invokeMock;
  }
  return {
    ChatOpenAI: vi.fn().mockImplementation(function() {
      return new MockChatOpenAI();
    }),
  };
});

describe('runRevenueSuggestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns mocked suggestion string', async () => {
    const decision = 'Test decision';
    const result = await runRevenueSuggestion(decision);
    // The worker currently returns a string from the LLM response;
    // ensure our mock matches that expectation.
    expect(result).toBe('Mocked revenue suggestion output');
    // Verify that ChatOpenAI was instantiated and called
    const { ChatOpenAI } = await import('@langchain/openai');
    expect(ChatOpenAI).toHaveBeenCalled();
    const instance = (ChatOpenAI as any).mock.results[0].value;
    expect(instance.invoke).toHaveBeenCalled();
  });
});
