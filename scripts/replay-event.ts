/**
 * Replay Event Script
 *
 * 🎯 任务：实现这个脚本，使其能够从 debug-payloads/ 目录读取 JSON 文件，
 * 并直接调用 Worker 的处理逻辑（绕过消息队列）。
 *
 * 用法：pnpm run replay -- --file=debug-payloads/job-xxx.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { AnalysisProcessor } from '../apps/worker-service/src/processors/analysis.processor';

// 解析命令行参数
// 支持格式: --file=value 或 --file value
function parseArgs() {
    const args = process.argv.slice(2);
    const options: Record<string, string> = {};

    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('--')) {
            const arg = args[i].substring(2);
            // 支持 --key=value 格式
            if (arg.includes('=')) {
                const [key, value] = arg.split('=');
                options[key] = value;
            } else {
                // 支持 --key value 格式
                const value = args[i + 1];
                if (value && !value.startsWith('--')) {
                    options[arg] = value;
                    i++;
                }
            }
        }
    }

    return options;
}

async function main() {
    console.log('🎬 Starting event replay...');

    const options = parseArgs();
    const filePath = options.file;

    if (!filePath) {
        console.error('❌ Missing --file argument');
        console.log('📝 Usage: pnpm run replay -- --file=debug-payloads/job-xxx.json');
        process.exit(1);
    }

    try {
        // 读取 JSON 文件
        console.log(`📖 Reading payload from: ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf-8');
        const payload = JSON.parse(content);

        // 提取 event 对象
        const event = payload.event;
        if (!event) {
            console.error('❌ Invalid payload format - missing event property');
            process.exit(1);
        }

        console.log(`🚀 Replaying event for job: ${event.jobId}`);

        // 初始化处理器并处理事件
        const processor = new AnalysisProcessor();
        await processor.process(event);

        console.log('✅ Replay completed successfully!');
    } catch (error) {
        console.error('❌ Error during replay:', error);
        process.exit(1);
    }
}

main();
