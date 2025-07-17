export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('Initializing OpenTelemetry instrumentation...');
    
    
    try {
      // Dynamic imports to handle module resolution
      const { NodeSDK } = await import('@opentelemetry/sdk-node');
      const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node');
      const { Resource } = await import('@opentelemetry/resources');
      const { SemanticResourceAttributes } = await import('@opentelemetry/semantic-conventions');
      const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
      const { BatchSpanProcessor } = await import('@opentelemetry/sdk-trace-base');
      const { diag, DiagConsoleLogger, DiagLogLevel, trace } = await import('@opentelemetry/api');

      // Enable diagnostic logging
      diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

      // Configure the trace exporter to send to our dev tool
      const traceExporter = new OTLPTraceExporter({
        url: 'http://localhost:58422/api/otel/traces',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Create resource with service information
      const resource = Resource.default().merge(
        new Resource({
          [SemanticResourceAttributes.SERVICE_NAME]: 'nextjs-hello-world',
          [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
        })
      );

      // Initialize the SDK
      const sdk = new NodeSDK({
        resource,
        spanProcessor: new BatchSpanProcessor(traceExporter),
        instrumentations: [
          getNodeAutoInstrumentations({
            '@opentelemetry/instrumentation-fs': {
              enabled: false, // Disable fs instrumentation to reduce noise
            },
          }),
        ],
      });

      // Start the SDK
      sdk.start();
      console.log('OpenTelemetry SDK started successfully');

      // Custom instrumentation example - trace API routes
      const originalFetch = global.fetch;
      if (originalFetch) {
        global.fetch = async function(...args: any[]) {
          const tracer = trace.getTracer('nextjs-custom', '1.0.0');
          const span = tracer.startSpan('custom-fetch');
          
          try {
            const [input, init] = args;
            const url = typeof input === 'string' ? input : input.url;
            
            span.setAttributes({
              'http.url': url,
              'http.method': init?.method || 'GET',
              'http.target': new URL(url).pathname,
            });

            const result = await originalFetch.apply(this, args);
            
            span.setAttributes({
              'http.status_code': result.status,
            });
            
            return result;
          } catch (error: any) {
            span.recordException(error);
            span.setStatus({ code: 2, message: error.message });
            throw error;
          } finally {
            span.end();
          }
        };
      }

      // Graceful shutdown
      process.on('SIGTERM', () => {
        sdk.shutdown()
          .then(() => console.log('OpenTelemetry terminated successfully'))
          .catch((error) => console.error('Error terminating OpenTelemetry', error))
          .finally(() => process.exit(0));
      });
    } catch (error) {
      console.error('Failed to initialize OpenTelemetry:', error);
      console.log('Please install the required packages:');
      console.log('bun install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http @opentelemetry/instrumentation-http @opentelemetry/instrumentation-fetch @opentelemetry/resources @opentelemetry/semantic-conventions');
    }
  }
}