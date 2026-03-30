// Import hàm vừa viết (nếu dùng module type)
import { getCollectionName } from './src/utils/sharding.js';

console.log("--- Test Sharding ---");
console.log(`channel_abc -> ${getCollectionName("channel_abc")}`);
console.log(`channel_xyz -> ${getCollectionName("channel_xyz")}`);
console.log(`general     -> ${getCollectionName("general")}`);
console.log(`random      -> ${getCollectionName("random")}`);
