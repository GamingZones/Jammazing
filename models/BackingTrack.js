// BackingTrack Model for MongoDB
class BackingTrack {
    constructor(mongoDb) {
        this.db = mongoDb;
    }

    // Create a new backing track
    async create(trackData) {
        const { title, artist, genre, description, fileUrl, duration, bpm, keySignature, uploaderId } = trackData;
        
        return await this.db.createBackingTrack({
            title,
            artist,
            genre,
            description,
            fileUrl,
            duration,
            bpm,
            keySignature,
            uploaderId
        });
    }

    // Get track by ID
    async getById(id) {
        return await this.db.getBackingTrackById(id);
    }

    // Get all tracks
    async getAll() {
        try {
            const tracks = (await this.db.db.ref('backingTracks').once('value')).val();
            if (!tracks) return [];
            return Object.values(tracks).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error('Error getting all tracks:', error);
            return [];
        }
    }

    // Get featured tracks
    async getFeaturedTracks() {
        try {
            const tracks = (await this.db.db.ref('backingTracks').once('value')).val();
            if (!tracks) return [];
            return Object.values(tracks)
                .filter(t => t.isFeatured)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error('Error getting featured tracks:', error);
            return [];
        }
    }

    // Get tracks by uploader
    async getByUploader(uploaderId) {
        try {
            const tracks = (await this.db.db.ref('backingTracks').once('value')).val();
            if (!tracks) return [];
            return Object.values(tracks)
                .filter(t => t.uploaderId === uploaderId)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error('Error getting tracks by uploader:', error);
            return [];
        }
    }

    // Get tracks by genre
    async getByGenre(genre) {
        try {
            const tracks = (await this.db.db.ref('backingTracks').once('value')).val();
            if (!tracks) return [];
            const regex = new RegExp(genre, 'i');
            return Object.values(tracks)
                .filter(t => regex.test(t.genre || ''))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error('Error getting tracks by genre:', error);
            return [];
        }
    }

    // Search tracks
    async search(searchTerm) {
        try {
            const tracks = (await this.db.db.ref('backingTracks').once('value')).val();
            if (!tracks) return [];
            const regex = new RegExp(searchTerm, 'i');
            return Object.values(tracks)
                .filter(t => 
                    regex.test(t.title || '') || 
                    regex.test(t.artist || '') || 
                    regex.test(t.genre || '')
                )
                .sort((a, b) => b.playCount - a.playCount);
        } catch (error) {
            console.error('Error searching tracks:', error);
            return [];
        }
    }

    // Update track info
    async update(id, trackData) {
        const { title, artist, genre, description, bpm, keySignature } = trackData;
        
        const updates = {};
        if (title !== undefined) updates.title = title;
        if (artist !== undefined) updates.artist = artist;
        if (genre !== undefined) updates.genre = genre;
        if (description !== undefined) updates.description = description;
        if (bpm !== undefined) updates.bpm = bpm;
        if (keySignature !== undefined) updates.keySignature = keySignature;

        return await this.db.db.ref(`backingTracks/${id}`).update(updates);
    }

    // Increment play count
    async incrementPlayCount(id) {
        try {
            const track = await this.db.getBackingTrackById(id);
            const currentCount = track?.playCount || 0;
            return await this.db.db.ref(`backingTracks/${id}`).update({
                playCount: currentCount + 1
            });
        } catch (error) {
            console.error('Error incrementing play count:', error);
            throw error;
        }
    }

    // Set as featured
    async setFeatured(id, featured) {
        return await this.db.db.ref(`backingTracks/${id}`).update({
            isFeatured: featured || false
        });
    }

    // Delete track
    async delete(id) {
        return await this.db.db.ref(`backingTracks/${id}`).remove();
    }

    // Get track statistics
    async getTrackStats(id) {
        try {
            const track = await this.db.getBackingTrackById(id);
            if (!track) return null;

            let ratingCount = 0;
            let totalRating = 0;

            const ratings = (await this.db.db.ref('ratings').once('value')).val();
            if (ratings) {
                Object.values(ratings).forEach(rating => {
                    if (rating.trackId === id) {
                        ratingCount++;
                        totalRating += rating.rating;
                    }
                });
            }

            return {
                playCount: track.playCount,
                ratingCount,
                averageRating: ratingCount > 0 ? totalRating / ratingCount : 0
            };
        } catch (error) {
            console.error('Error getting track stats:', error);
            return null;
        }
    }

    // Get top tracks by play count
    async getTopTracks(limit = 10) {
        try {
            const tracks = (await this.db.db.ref('backingTracks').once('value')).val();
            if (!tracks) return [];
            return Object.values(tracks)
                .sort((a, b) => b.playCount - a.playCount)
                .slice(0, limit);
        } catch (error) {
            console.error('Error getting top tracks:', error);
            return [];
        }
    }
}

module.exports = BackingTrack;
