// LiveStream Model
class LiveStream {
    constructor(firebaseDb) {
        this.db = firebaseDb;
    }

    // Create a new stream
    async create(streamData) {
        const { streamerId, title, description, topic, thumbnail, streamUrl, scheduledStartTime } = streamData;
        
        return await this.db.createLiveStream({
            streamerId,
            title,
            description,
            topic,
            thumbnail,
            streamUrl,
            scheduledStartTime
        });
    }

    // Get stream by ID
    async getById(id) {
        return await this.db.getLiveStreamById(id);
    }

    // Get all live streams
    async getAll() {
        try {
            const streams = (await this.db.db.ref('liveStreams').once('value')).val();
            if (!streams) return [];
            return Object.values(streams).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error('Error getting all streams:', error);
            return [];
        }
    }

    // Get active live streams
    async getActiveLiveStreams() {
        try {
            const streams = (await this.db.db.ref('liveStreams').once('value')).val();
            if (!streams) return [];
            return Object.values(streams)
                .filter(s => s.isLive)
                .sort((a, b) => new Date(b.actualStartTime) - new Date(a.actualStartTime));
        } catch (error) {
            console.error('Error getting active streams:', error);
            return [];
        }
    }

    // Get upcoming streams
    async getUpcomingStreams() {
        try {
            const now = new Date();
            const streams = (await this.db.db.ref('liveStreams').once('value')).val();
            if (!streams) return [];
            return Object.values(streams)
                .filter(s => !s.isLive && new Date(s.scheduledStartTime) > now)
                .sort((a, b) => new Date(a.scheduledStartTime) - new Date(b.scheduledStartTime));
        } catch (error) {
            console.error('Error getting upcoming streams:', error);
            return [];
        }
    }

    // Get streams by streamer
    async getByStreamer(streamerId) {
        try {
            const streams = (await this.db.db.ref('liveStreams').once('value')).val();
            if (!streams) return [];
            return Object.values(streams)
                .filter(s => s.streamerId === streamerId)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error('Error getting streams by streamer:', error);
            return [];
        }
    }

    // Start a stream
    async startStream(id, actualStartTime = null) {
        const timestamp = actualStartTime || new Date().toISOString();
        return await this.db.db.ref(`liveStreams/${id}`).update({
            isLive: true,
            actualStartTime: timestamp,
            updatedAt: new Date().toISOString()
        });
    }

    // End a stream
    async endStream(id) {
        const now = new Date().toISOString();
        return await this.db.db.ref(`liveStreams/${id}`).update({
            isLive: false,
            endTime: now,
            updatedAt: now
        });
    }

    // Update stream info
    async update(id, streamData) {
        const { title, description, topic, thumbnail } = streamData;
        
        const updates = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (topic !== undefined) updates.topic = topic;
        if (thumbnail !== undefined) updates.thumbnail = thumbnail;
        updates.updatedAt = new Date().toISOString();

        return await this.db.db.ref(`liveStreams/${id}`).update(updates);
    }

    // Update viewer count
    async updateViewerCount(id, count) {
        return await this.db.db.ref(`liveStreams/${id}`).update({
            viewerCount: count,
            updatedAt: new Date().toISOString()
        });
    }

    // Increment viewer count
    async incrementViewerCount(id) {
        try {
            const stream = await this.db.getLiveStreamById(id);
            const currentCount = stream?.viewerCount || 0;
            return await this.db.db.ref(`liveStreams/${id}`).update({
                viewerCount: currentCount + 1
            });
        } catch (error) {
            console.error('Error incrementing viewer count:', error);
            throw error;
        }
    }

    // Add viewer to stream
    async addViewer(streamId, viewerId) {
        return await this.db.addStreamViewer(streamId, viewerId);
    }

    // Remove viewer from stream
    async removeViewer(streamId, viewerId) {
        return await this.db.removeStreamViewer(streamId, viewerId);
    }

    // Get viewers for a stream
    async getViewers(streamId) {
        try {
            const stream = await this.db.getLiveStreamById(streamId);
            if (!stream || !stream.viewers) return [];
            
            const viewerIds = Object.keys(stream.viewers);
            const viewers = [];
            
            for (const viewerId of viewerIds) {
                const user = await this.db.getUserById(viewerId);
                if (user) {
                    viewers.push({
                        ...user,
                        joinedAt: stream.viewers[viewerId].joinedAt,
                        leftAt: stream.viewers[viewerId].leftAt
                    });
                }
            }
            
            return viewers;
        } catch (error) {
            console.error('Error getting viewers:', error);
            return [];
        }
    }

    // Delete stream
    async delete(id) {
        return await this.db.db.ref(`liveStreams/${id}`).remove();
    }

    // Get stream statistics
    async getStreamStats(id) {
        try {
            const viewers = await this.getViewers(id);
            let totalWatchTimeMinutes = 0;
            
            viewers.forEach(v => {
                if (v.joinedAt && v.leftAt) {
                    const joinTime = new Date(v.joinedAt);
                    const leftTime = new Date(v.leftAt);
                    const watchTimeMinutes = (leftTime - joinTime) / (1000 * 60);
                    totalWatchTimeMinutes += watchTimeMinutes;
                }
            });

            return {
                uniqueViewers: viewers.length,
                totalViews: viewers.length,
                avgWatchTimeMinutes: viewers.length > 0 ? totalWatchTimeMinutes / viewers.length : 0
            };
        } catch (error) {
            console.error('Error getting stream stats:', error);
            return { uniqueViewers: 0, totalViews: 0, avgWatchTimeMinutes: 0 };
        }
    }
}

module.exports = LiveStream;
