#!/bin/bash

for i in 1 2 3 4 5; do
  curl -s -X POST http://localhost:3000/api/v1/messages/send \
    -H "Content-Type: application/json" \
    -d "{\"channelId\":\"test_ch\",\"senderUid\":\"user1\",\"content\":\"Message $i\"}" | jq .message_seq
done
