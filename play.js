
const YTDownloader = require('./lib/ytdl2');
const yts = require('youtube-yts');
const { channelInfo } = require('./lib/messageConfig');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

// Ensure temp directory exists
const tempDir = './temp';
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

ffmpeg.setFfmpegPath(ffmpegPath);

async function playCommand(sock, chatId, songTitle) {
    if (!songTitle) {
        await sock.sendMessage(chatId, {
            text: '❌ Please provide a song title!\n\nExample: .play Shape of You',
            ...channelInfo
        });
        return;
    }

    try {
        await sock.sendMessage(chatId, { 
            text: '🔍 Searching your song...',
            ...channelInfo
        });

        // Search for the song
        const videos = await YTDownloader.search(songTitle);
        if (!videos.length) {
            await sock.sendMessage(chatId, {
                text: '❌ No songs found for: ' + songTitle,
                ...channelInfo
            });
            return;
        }

        const video = videos[0];
        await sock.sendMessage(chatId, {
            text: `🎵 Downloading: ${video.title}\n⏳ Please wait...`,
            ...channelInfo
        });

        // Download and convert to mp3
        const audioFile = await YTDownloader.downloadMusic(video.url);
        
        // Send the audio
        await sock.sendMessage(chatId, {
            audio: { url: audioFile.path },
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: `${video.title}.mp3`,
            ...channelInfo
        });

        // Cleanup temp file
        try {
            fs.unlinkSync(audioFile.path);
        } catch (err) {
            console.error('Error cleaning up file:', err);
        }

    } catch (error) {
        console.error('Error in play command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to play audio! Try again later.',
            ...channelInfo
        });
    }
}

module.exports = { playCommand };
