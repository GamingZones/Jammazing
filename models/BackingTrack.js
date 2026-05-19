// BackingTrack Model
class BackingTrack {
    constructor(db) {
        this.db = db;
    }

    // Create a new backing track
    async create(trackData) {
        const { title, artist, genre, description, fileUrl, duration, bpm, keySignature, uploaderId } = trackData;
        
        const sql = `
            INSERT INTO backingTracks (title, artist, genre, description, fileUrl, duration, bpm, keySignature, uploaderId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        return await this.db.run(sql, [
            title,
            artist,
            genre,
            description,
            fileUrl,
            duration,
            bpm,
            keySignature,
            uploaderId
        ]);
    }

    // Get track by ID
    async getById(id) {
        const sql = `
            SELECT bt.*, u.username, u.firstName, u.lastName
            FROM backingTracks bt
            JOIN users u ON bt.uploaderId = u.id
            WHERE bt.id = ?
        `;
        return await this.db.get(sql, [id]);
    }

    // Get all tracks
    async getAll() {
        const sql = `
            SELECT bt.*, u.username, u.firstName, u.lastName
            FROM backingTracks bt
            JOIN users u ON bt.uploaderId = u.id
            ORDER BY bt.createdAt DESC
        `;
        return await this.db.all(sql);
    }

    // Get featured tracks
    async getFeaturedTracks() {
        const sql = `
            SELECT bt.*, u.username, u.firstName, u.lastName
            FROM backingTracks bt
            JOIN users u ON bt.uploaderId = u.id
            WHERE bt.isFeatured = 1
            ORDER BY bt.createdAt DESC
        `;
        return await this.db.all(sql);
    }

    // Get tracks by uploader
    async getByUploader(uploaderId) {
        const sql = `
            SELECT bt.*, u.username, u.firstName, u.lastName
            FROM backingTracks bt
            JOIN users u ON bt.uploaderId = u.id
            WHERE bt.uploaderId = ?
            ORDER BY bt.createdAt DESC
        `;
        return await this.db.all(sql, [uploaderId]);
    }

    // Get tracks by genre
    async getByGenre(genre) {
        const sql = `
            SELECT bt.*, u.username, u.firstName, u.lastName
            FROM backingTracks bt
            JOIN users u ON bt.uploaderId = u.id
            WHERE bt.genre LIKE ?
            ORDER BY bt.createdAt DESC
        `;
        return await this.db.all(sql, [`%${genre}%`]);
    }

    // Search tracks
    async search(searchTerm) {
        const sql = `
            SELECT bt.*, u.username, u.firstName, u.lastName
            FROM backingTracks bt
            JOIN users u ON bt.uploaderId = u.id
            WHERE bt.title LIKE ? OR bt.artist LIKE ? OR bt.genre LIKE ?
            ORDER BY bt.playCount DESC
        `;
        const term = `%${searchTerm}%`;
        return await this.db.all(sql, [term, term, term]);
    }

    // Update track info
    async update(id, trackData) {
        const { title, artist, genre, description, bpm, keySignature } = trackData;
        
        const sql = `
            UPDATE backingTracks 
            SET title = COALESCE(?, title),
                artist = COALESCE(?, artist),
                genre = COALESCE(?, genre),
                description = COALESCE(?, description),
                bpm = COALESCE(?, bpm),
                keySignature = COALESCE(?, keySignature)
            WHERE id = ?
        `;

        return await this.db.run(sql, [title, artist, genre, description, bpm, keySignature, id]);
    }

    // Increment play count
    async incrementPlayCount(id) {
        const sql = 'UPDATE backingTracks SET playCount = playCount + 1 WHERE id = ?';
        return await this.db.run(sql, [id]);
    }

    // Set as featured
    async setFeatured(id, featured) {
        const sql = 'UPDATE backingTracks SET isFeatured = ? WHERE id = ?';
        return await this.db.run(sql, [featured ? 1 : 0, id]);
    }

    // Delete track
    async delete(id) {
        const sql = 'DELETE FROM backingTracks WHERE id = ?';
        return await this.db.run(sql, [id]);
    }

    // Get track statistics
    async getTrackStats(id) {
        const sql = `
            SELECT 
                playCount,
                (SELECT COUNT(*) FROM ratings WHERE trackId = ?) as ratingCount,
                (SELECT AVG(rating) FROM ratings WHERE trackId = ?) as averageRating
            FROM backingTracks
            WHERE id = ?
        `;
        return await this.db.get(sql, [id, id, id]);
    }

    // Get top tracks by play count
    async getTopTracks(limit = 10) {
        const sql = `
            SELECT bt.*, u.username, u.firstName, u.lastName
            FROM backingTracks bt
            JOIN users u ON bt.uploaderId = u.id
            ORDER BY bt.playCount DESC
            LIMIT ?
        `;
        return await this.db.all(sql, [limit]);
    }
}

module.exports = BackingTrack;
