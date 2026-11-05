import net from 'net';
import Aedes from 'aedes';
import { logger } from '../../utils/logger';

let aedesInstance: any = null;
let tcpServer: net.Server | null = null;

export const startEmbeddedBroker = async (port = 1883): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      aedesInstance = new Aedes();
      tcpServer = net.createServer(aedesInstance.handle);

      tcpServer.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          logger.info(`Port ${port} in use. An external MQTT broker (Mosquitto) is already running.`);
        } else {
          logger.warn(`Embedded broker error: ${err.message}`);
        }
        resolve(false);
      });

      tcpServer.listen(port, '0.0.0.0', () => {
        logger.info(`Embedded Aedes MQTT broker started and listening on 0.0.0.0:${port} (LAN accessible).`);
        resolve(true);
      });
    } catch (err: any) {
      logger.warn(`Could not start embedded MQTT broker: ${err.message}`);
      resolve(false);
    }
  });
};

export const stopEmbeddedBroker = async () => {
  if (tcpServer) {
    tcpServer.close();
  }
  if (aedesInstance) {
    aedesInstance.close();
  }
};

