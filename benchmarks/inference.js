import { RKLLM, RKLLMInputType } from '../dist/index.js';

class RKLLMBenchmark {
  constructor(config) {
    this.llm = new RKLLM();
    this.config = config;
  }

  async init(params = {}) {
    const defaultParams = {
      modelPath: this.config.modelPath,
      maxContextLen: 2048,
      maxNewTokens: 256,
      temperature: 0.7,
      topP: 0.9,
      topK: 50,
      ...params,
    };

    await this.llm.init(defaultParams);
  }

  async warmup() {
    console.log(`🔥 Running ${this.config.warmupRuns} warmup iterations...`);
    
    for (let i = 0; i < this.config.warmupRuns; i++) {
      await this.llm.run({
        inputType: RKLLMInputType.PROMPT,
        inputData: "Hello, this is a warmup run.",
      });
      console.log('.');
    }
    console.log(' Done!');
  }

  async benchmarkSinglePrompt(prompt) {
    const results = [];
    
    console.log(`\n📊 Benchmarking prompt: "${prompt.substring(0, 50)}..."`);
    
    for (let i = 0; i < this.config.iterations; i++) {
      const startTime = performance.now();
      
      const result = await this.llm.run({
        inputType: RKLLMInputType.PROMPT,
        inputData: prompt,
      });
      
      const endTime = performance.now();
      const timeMs = endTime - startTime;
      
      // Estimate token count (rough approximation)
      const tokenCount = result.text ? Math.ceil(result.text.length / 4) : 0;
      const tokensPerSecond = tokenCount / (timeMs / 1000);
      
      results.push({
        prompt,
        tokenCount,
        timeMs,
        tokensPerSecond,
      });
      
      console.log(`[${i + 1}/${this.config.iterations}] `);
    }
    
    return results;
  }

  async runBenchmark() {
    console.log('🚀 Starting RKLLM Benchmark Suite');
    console.log('='.repeat(50));
    
    try {
      await this.init();
      await this.warmup();
      
      const allResults = [];
      
      for (const prompt of this.config.prompts) {
        const results = await this.benchmarkSinglePrompt(prompt);
        allResults.push(...results);
        
        // Calculate statistics for this prompt
        const avgTime = results.reduce((sum, r) => sum + r.timeMs, 0) / results.length;
        const avgTokensPerSec = results.reduce((sum, r) => sum + r.tokensPerSecond, 0) / results.length;
        const minTime = Math.min(...results.map(r => r.timeMs));
        const maxTime = Math.max(...results.map(r => r.timeMs));
        
        console.log(`\n📈 Results for this prompt:`);
        console.log(`   Average time: ${avgTime.toFixed(2)}ms`);
        console.log(`   Average speed: ${avgTokensPerSec.toFixed(2)} tokens/sec`);
        console.log(`   Min time: ${minTime.toFixed(2)}ms`);
        console.log(`   Max time: ${maxTime.toFixed(2)}ms`);
      }
      
      // Overall statistics
      const overallAvgTime = allResults.reduce((sum, r) => sum + r.timeMs, 0) / allResults.length;
      const overallAvgSpeed = allResults.reduce((sum, r) => sum + r.tokensPerSecond, 0) / allResults.length;
      
      console.log('\n🏆 Overall Results:');
      console.log('='.repeat(50));
      console.log(`Total runs: ${allResults.length}`);
      console.log(`Average inference time: ${overallAvgTime.toFixed(2)}ms`);
      console.log(`Average throughput: ${overallAvgSpeed.toFixed(2)} tokens/sec`);
      console.log(`Total prompts tested: ${this.config.prompts.length}`);
      
    } finally {
      await this.llm.destroy();
    }
  }
}

// Default benchmark configuration - requires real model path
const defaultConfig = {
  modelPath: '', // Will be set from environment variable
  prompts: [
    "What is the capital of France?",
    "Explain quantum computing in simple terms.", 
    "Write a haiku about autumn leaves.",
    "How do neural networks work?",
    "Tell me a joke about programming.",
  ],
  iterations: 5,
  warmupRuns: 3,
};

// Run benchmark if this file is executed directly
if (import.meta.path === Bun?.main) {
  // Get model path from environment
  const modelPath = Bun?.env?.RKLLM_MODEL_PATH;
  
  if (!modelPath) {
    console.log('❌ No model path provided!');
    console.log('💡 Please set RKLLM_MODEL_PATH environment variable:');
    console.log('   bun tools.ts pull microsoft/DialoGPT-small pytorch_model.bin');
    console.log('   export RKLLM_MODEL_PATH="./models/microsoft_DialoGPT-small/pytorch_model.bin"');
    console.log('   bun benchmarks/inference.js');
    process.exit(1);
  }
  
  defaultConfig.modelPath = modelPath;
  const benchmark = new RKLLMBenchmark(defaultConfig);
  
  console.log('🎯 RKLLM Benchmark Tool');
  console.log(`📂 Using model: ${modelPath}`);
  console.log();
  
  await benchmark.runBenchmark();
}

export { RKLLMBenchmark };
