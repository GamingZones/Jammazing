const http = require('http');

// Test sending a chat message
const testMessage = {
    senderId: 1,
    senderName: 'Gaming',
    message: 'Test message from script',
    videoOffset: 2.5
};

const postData = JSON.stringify(testMessage);

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/livestreams/1/chat',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log('Response:', data);
        if (res.statusCode === 201) {
            console.log('✅ Chat message sent successfully!');
        } else {
            console.log('❌ Error sending message');
        }
    });
});

req.on('error', (error) => {
    console.error('Request error:', error);
});

req.write(postData);
req.end();

console.log('Sending test message...');
