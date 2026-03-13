import { Module } from '@nestjs/common';

import { FakeSummarizationProvider } from './fake-summarization.provider';
import { SUMMARIZATION_PROVIDER } from './summarization-provider.interface';

import { GeminiSummarizationProvider } from './gemini-summarization.provider';

const summarizationProviderFactory = {
  provide: SUMMARIZATION_PROVIDER,
  useFactory: () => {
    if (process.env.GEMINI_API_KEY) {
      return new GeminiSummarizationProvider();
    }
    return new FakeSummarizationProvider();
  },
};

@Module({
  providers: [
    FakeSummarizationProvider,
    GeminiSummarizationProvider,
    summarizationProviderFactory,
  ],
  exports: [SUMMARIZATION_PROVIDER, FakeSummarizationProvider, GeminiSummarizationProvider],
})
export class LlmModule { }
