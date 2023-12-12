import { NodeSDK } from '@opentelemetry/sdk-node';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import reasonConfig from '../configs/reason-config';

export default function setupOpenTEL() {
  let exporter: any;
  if (reasonConfig.openTelemetryExporter) {
    console.log(`RΞASON — Using custom OpenTelemetry exporter`)
    exporter = reasonConfig.openTelemetryExporter;
  } else {
    exporter = new ZipkinExporter({
      url: 'http://localhost:9411/api/v2/spans',
    });
  }

  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'app',
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0',
    }),
    traceExporter: exporter,
  });
  
  sdk.start();
}