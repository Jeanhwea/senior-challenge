import { QueuePoller } from './queue-poller';
import { AnalysisProcessor } from './processors/analysis.processor';
import { CaptureMiddleware } from './middleware/capture.middleware';

/**
 * Worker Service entry point.
 * Polls for messages and processes them.
 */
async function main(): Promise<void> {
    console.log('🚀 Starting Worker Service...');

    const processor = new AnalysisProcessor();
    
    // Wrap processor with capture middleware if enabled
    const isCaptureMode = process.env.CAPTURE_MODE === 'true';
    const finalProcessor = isCaptureMode 
        ? new CaptureMiddleware(processor)
        : processor;

    const poller = new QueuePoller(finalProcessor);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down...');
        poller.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\n🛑 Shutting down...');
        poller.stop();
        process.exit(0);
    });

    await poller.start();
}

main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
