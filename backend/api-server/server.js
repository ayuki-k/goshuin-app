const express = require('express');
const AWS = require('aws-sdk');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Configure AWS SDK for LocalStack
AWS.config.update({
  endpoint: process.env.LOCALSTACK_URL || 'http://localhost:4566',
  region: process.env.AWS_REGION || 'ap-northeast-1',
  accessKeyId: 'test',
  secretAccessKey: 'test'
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'goshuin-api' });
});

// Search shrines/temples
app.get('/shrines-temples', async (req, res) => {
  try {
    const { prefecture, city, type, hasGoshuin } = req.query;
    
    let params = {
      TableName: 'ShrineTemple'
    };

    // For a full scan (in production, you'd want better indexing)
    const result = await dynamodb.scan(params).promise();
    let items = result.Items || [];

    // Apply filters
    if (prefecture) {
      items = items.filter(item => 
        item.prefecture && item.prefecture.toLowerCase().includes(prefecture.toLowerCase())
      );
    }

    if (city) {
      items = items.filter(item => 
        item.city && item.city.toLowerCase().includes(city.toLowerCase())
      );
    }

    if (type && type !== 'all') {
      items = items.filter(item => item.type === type);
    }

    if (hasGoshuin !== undefined) {
      const hasGoshuinBool = hasGoshuin === 'true';
      items = items.filter(item => item.hasGoshuin === hasGoshuinBool);
    }

    res.json(items);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search by location (nearby) - separate route to avoid conflict
app.get('/search/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const centerLat = parseFloat(lat);
    const centerLng = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    // Scan all items (in production, use geo indexing)
    const params = {
      TableName: 'ShrineTemple'
    };

    const result = await dynamodb.scan(params).promise();
    let items = result.Items || [];

    // Filter by distance (simple approximation)
    items = items.filter(item => {
      if (!item.lat || !item.lng) return false;
      
      const distance = calculateDistance(
        centerLat, centerLng,
        parseFloat(item.lat), parseFloat(item.lng)
      );
      
      return distance <= radiusKm;
    });

    res.json(items);
  } catch (error) {
    console.error('Nearby search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get shrine/temple by ID
app.get('/shrines-temples/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const params = {
      TableName: 'ShrineTemple',
      Key: { id }
    };

    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
      return res.status(404).json({ error: 'Shrine/Temple not found' });
    }

    res.json(result.Item);
  } catch (error) {
    console.error('Get by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

app.listen(PORT, () => {
  console.log(`🚀 Goshuin API Server running on port ${PORT}`);
  console.log(`📍 LocalStack endpoint: ${process.env.LOCALSTACK_URL || 'http://localhost:4566'}`);
});