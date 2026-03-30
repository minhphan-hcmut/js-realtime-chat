import { z } from 'zod';



export const createGroupSchema = z.object({
    channelId: z.string().min(1, 'channelId is required'),
    name: z.string().min(1, 'name is required').max(100),
    ownerUid: z.string().min(1, 'ownerUid is required'),
});

export const joinGroupSchema = z.object({
    channelId: z.string().min(1, 'channelId is required'),
    uid: z.string().min(1, 'uid is required'),
});

export const sendMessageSchema = z.object({
    channelId: z.string().min(1, 'channelId is required'),
    senderUid: z.string().min(1, 'senderUid is required'),
    content: z.string().min(1, 'content is required').max(5000),
    type: z.enum(['text', 'image', 'file']).default('text'),
});

export const clearHistorySchema = z.object({
    uid: z.string().min(1, 'uid is required'),
    channelId: z.string().min(1, 'channelId is required'),
});

export const deleteForMeSchema = z.object({
    uid: z.string().min(1, 'uid is required').max(100),
    messageId: z.string().min(1, 'channelId is required').max(100),
}).strict();



// message schema
export const listMessageSchema = z.object({
    uid: z.string().trim().min(1, 'uid is required').max(100),
    channelId: z.string().trim().min(1, 'channelId is required').max(100),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
    startSeq: z.coerce.number().int().min(0).optional(),
}).strict();


// conversation schema
export const syncSchema = z.object({
    uid: z.string().trim().min(1, 'uid is required').max(100),
    clientVersion: z.coerce.number().int().min(0).default(0),
}).strict();


export const markReadSchema = z.object({
    uid: z.string().trim().min(1, 'uid is required').max(100),
    channelId: z.string().trim().min(1, 'channelId is required').max(100),
}).strict();



