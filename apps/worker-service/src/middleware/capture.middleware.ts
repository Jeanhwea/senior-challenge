import * as fs from 'fs';
import * as path from 'path';
import type { AnalysisRequestedEvent } from '@senior-challenge/shared-types';
import type { MessageProcessor } from '../processors/processor.interface';

const DEBUG_PAYLOADS_DIR = path.join(process.cwd(), 'debug-payloads');

/**
 * Capture Middleware - captures SQS message payloads when CAPTURE_MODE is enabled.
 * This allows for local replay and debugging of production issues.
 */
export class CaptureMiddleware implements MessageProcessor {
    private isCaptureModeEnabled: boolean;

    constructor(private readonly processor: MessageProcessor) {
        this.isCaptureModeEnabled = process.env.CAPTURE_MODE === 'true';
        
        if (this.isCaptureModeEnabled) {
            this.ensureDebugPayloadsDir();
            console.log('🔍 Capture mode enabled - payloads will be saved to:', DEBUG_PAYLOADS_DIR);
        }
    }

    /**
     * Ensures the debug-payloads directory exists.
     */
    private ensureDebugPayloadsDir(): void {
        if (!fs.existsSync(DEBUG_PAYLOADS_DIR)) {
            fs.mkdirSync(DEBUG_PAYLOADS_DIR, { recursive: true });
        }
    }

    /**
     * Processes the event and captures the payload if capture mode is enabled.
     */
    async process(event: AnalysisRequestedEvent): Promise<void> {
        // Capture payload if enabled
        if (this.isCaptureModeEnabled) {
            this.capturePayload(event);
        }

        // Delegate to the actual processor
        await this.processor.process(event);
    }

    /**
     * Captures the payload to a JSON file in debug-payloads directory.
     */
    private capturePayload(event: AnalysisRequestedEvent): void {
        try {
            const { jobId } = event;
            const filename = `job-${jobId}-${Date.now()}.json`;
            const filepath = path.join(DEBUG_PAYLOADS_DIR, filename);
            
            const payload = {
                event,
                timestamp: new Date().toISOString(),
                metadata: {
                    capturedAt: new Date().toISOString(),
                    jobId,
                }
            };

            fs.writeFileSync(filepath, JSON.stringify(payload, null, 2));
            console.log(`📸 Captured payload: ${filename}`);
        } catch (error) {
            console.error('Failed to capture payload:', error);
        }
    }
}