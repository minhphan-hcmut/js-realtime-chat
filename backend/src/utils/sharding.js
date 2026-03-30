import crc32 from 'crc-32';

const SHARD_COUNT = 4;

/**
 * Xác định tên Collection (Shard) dựa trên Channel ID.
 * Sử dụng thuật toán Consistent Hashing đơn giản với CRC32.
 * * @param {string} channelId - ID của kênh chat
 * @returns {string} Tên collection tương ứng (vd: messages_0, messages_1...)
 */
export const getCollectionName = (channelId) => {
  // 1. Tính hash (trả về signed 32-bit integer)
  const hash = crc32.str(channelId);

  // 2. Chuyển sang unsigned integer bằng toán tử bitwise zero-fill right shift
  // Giải thích: JS dùng số bù 2 cho số âm, >>> 0 giúp ép kiểu về số dương thuần túy
  const unsignedHash = hash >>> 0;

  // 3. Lấy phần dư để xác định shard index (0 đến SHARD_COUNT - 1)
  const shardIndex = unsignedHash % SHARD_COUNT;

  // 4. Trả về tên collection
  return `messages_${shardIndex}`;
};