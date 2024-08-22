import {
  MongooseModuleAsyncOptions,
  MongooseModuleOptions,
} from '@nestjs/mongoose';
import { envorimentVariables } from '../env/envoriment';

const mongoConfig: MongooseModuleAsyncOptions = {
  useFactory: async (): Promise<MongooseModuleOptions> => {
    return {
      uri: envorimentVariables.mongoose.uri,
    };
  },
};
export default mongoConfig;
