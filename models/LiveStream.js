// LiveStream Model
class LiveStream {
    constructor(db) {
        this.db = db;
    }

    // Create a new stream
    async create(streamData) {
        const { streamerId, title, description, topic, thumbnail, streamUrl, scheduledStartTime } = streamData;
        
        const sql = `
            INSERT INTO liveStreams (streamerId, title, description, topic, thumbnail, streamUrl, scheduledStartTime)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        return await this.db.run(sql, [
            streamerId,
            title,
            description,
            topic,
            thumbnail,
            streamUrl,
            scheduledStartTime
        ]);
    }

    // Get stream by ID
    async getById(id) {
        const sql = 'SELECT * FROM liveStreams WHERE id = ?';
        return await this.db.get(sql, [id]);
    }

    // Get all live streams
    async getAll() {
        const sql = 'SELECT * FROM liveStreams ORDER BY createdAt DESC';
        return await this.db.all(sql);
    }

    // Get active live streams
    async getActiveLiveStreams() {
        const sql = 'SELECT * FROM liveStreams WHERE isLive = 1 ORDER BY actualStartTime DESC';
        return await this.db.all(sql);
    }

    // Get upcoming streams
    async getUpcomingStreams() {
        const sql = `
            SELECT * FROM liveStreams 
            WHERE isLive = 0 AND scheduledStartTime > CURRENT_TIMESTAMP
            ORDER BY scheduledStartTime ASC
        `;
        return await this.db.all(sql);
    }

    // Get streams by streamer
    async getByStreamer(streamerId) {
        const sql = 'SELECT * FROM liveStreams WHERE streamerId = ? ORDER BY createdAt DESC';
        return await this.db.all(sql, [streamerId]);
    }

    // Start a stream
    async startStream(id, actualStartTime = null) {
        const timestamp = actualStartTime || new Date().toISOString();
        const sql = `
            UPDATE liveStreams 
            SET isLive = 1, actualStartTime = ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        return await this.db.run(sql, [timestamp, id]);
    }

    // End a stream
    async endStream(id) {
        const now = new Date().toISOString();
        const sql = `
            UPDATE liveStreams 
            SET isLive = 0, endTime = ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        return await this.db.run(sql, [now, id]);
    }

    // Update stream info
    async update(id, streamData) {
        const { title, description, topic, thumbnail } = streamData;
        
        const sql = `
            UPDATE liveStreams 
            SET title = COALESCE(?, title),
                description = COALESCE(?, description),
                topic = COALESCE(?, topic),
                thumbnail = COALESCE(?, thumbnail),
                updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        return await this.db.run(sql, [title, description, topic, thumbnail, id]);
    }

    // Update viewer count
    async updateViewerCount(id, count) {
        const sql = 'UPDATE liveStreams SET viewerCount = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?';
        return await this.db.run(sql, [count, id]);
    }

    // Increment viewer count
    async incrementViewerCount(id) {
        const sql = 'UPDATE liveStreams SET viewerCount = viewerCount + 1 WHERE id = ?';
        return await this.db.run(sql, [id]);
    }

    // Add viewer to stream
    async addViewer(streamId, viewerId) {
        const sql = `
            INSERT INTO streamViewers (streamId, viewerId, joinedAt)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        `;
        return await this.db.run(sql, [streamId, viewerId]);
    }

    // Remove viewer from stream
    async removeViewer(streamId, viewerId) {
        const sql = `
            UPDATE streamViewers 
            SET leftAt = CURRENT_TIMESTAMP
            WHERE streamId = ? AND viewerId = ? AND leftAt IS NULL
        `;
        return await this.db.run(sql, [streamId, viewerId]);
    }

    // Get viewers for a stream
    async getViewers(streamId) {
        const sql = `
            SELECT u.*, sv.joinedAt, sv.leftAt
            FROM streamViewers sv
            JOIN users u ON sv.viewerId = u.id
            WHERE sv.streamId = ?
            ORDER BY sv.joinedAt DESC
        `;
        return await this.db.all(sql, [streamId]);
    }

    // Delete stream
    async delete(id) {
        const sql = 'DELETE FROM liveStreams WHERE id = ?';
        return await this.db.run(sql, [id]);
    }

    // Get stream statistics
    async getStreamStats(id) {
        const sql = `
            SELECT 
                COUNT(DISTINCT viewerId) as uniqueViewers,
                COUNT(*) as totalViews,
                AVG(CAST((JULIANDAY(leftAt) - JULIANDAY(joinedAt)) * 24 * 60 AS REAL)) as avgWatchTimeMinutes
            FROM streamViewers
            WHERE streamId = ?
        `;
        return await this.db.get(sql, [id]);
    }
}

module.exports = LiveStream;
