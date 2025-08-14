const express = require('express');
const AWS = require('aws-sdk');
const cors = require('cors');

// Prefecture mapping for Japanese-English conversion
const PREFECTURE_MAPPING = {
  // Japanese to English
  '北海道': 'Hokkaido',
  '青森': 'Aomori', '青森県': 'Aomori',
  '岩手': 'Iwate', '岩手県': 'Iwate', 
  '宮城': 'Miyagi', '宮城県': 'Miyagi',
  '秋田': 'Akita', '秋田県': 'Akita',
  '山形': 'Yamagata', '山形県': 'Yamagata',
  '福島': 'Fukushima', '福島県': 'Fukushima',
  '茨城': 'Ibaraki', '茨城県': 'Ibaraki',
  '栃木': 'Tochigi', '栃木県': 'Tochigi',
  '群馬': 'Gunma', '群馬県': 'Gunma',
  '埼玉': 'Saitama', '埼玉県': 'Saitama',
  '千葉': 'Chiba', '千葉県': 'Chiba',
  '東京': 'Tokyo', '東京都': 'Tokyo',
  '神奈川': 'Kanagawa', '神奈川県': 'Kanagawa',
  '新潟': 'Niigata', '新潟県': 'Niigata',
  '富山': 'Toyama', '富山県': 'Toyama',
  '石川': 'Ishikawa', '石川県': 'Ishikawa',
  '福井': 'Fukui', '福井県': 'Fukui',
  '山梨': 'Yamanashi', '山梨県': 'Yamanashi',
  '長野': 'Nagano', '長野県': 'Nagano',
  '岐阜': 'Gifu', '岐阜県': 'Gifu',
  '静岡': 'Shizuoka', '静岡県': 'Shizuoka',
  '愛知': 'Aichi', '愛知県': 'Aichi',
  '三重': 'Mie', '三重県': 'Mie',
  '滋賀': 'Shiga', '滋賀県': 'Shiga',
  '京都': 'Kyoto', '京都府': 'Kyoto',
  '大阪': 'Osaka', '大阪府': 'Osaka',
  '兵庫': 'Hyogo', '兵庫県': 'Hyogo',
  '奈良': 'Nara', '奈良県': 'Nara',
  '和歌山': 'Wakayama', '和歌山県': 'Wakayama',
  '鳥取': 'Tottori', '鳥取県': 'Tottori',
  '島根': 'Shimane', '島根県': 'Shimane',
  '岡山': 'Okayama', '岡山県': 'Okayama',
  '広島': 'Hiroshima', '広島県': 'Hiroshima',
  '山口': 'Yamaguchi', '山口県': 'Yamaguchi',
  '徳島': 'Tokushima', '徳島県': 'Tokushima',
  '香川': 'Kagawa', '香川県': 'Kagawa',
  '愛媛': 'Ehime', '愛媛県': 'Ehime',
  '高知': 'Kochi', '高知県': 'Kochi',
  '福岡': 'Fukuoka', '福岡県': 'Fukuoka',
  '佐賀': 'Saga', '佐賀県': 'Saga',
  '長崎': 'Nagasaki', '長崎県': 'Nagasaki',
  '熊本': 'Kumamoto', '熊本県': 'Kumamoto',
  '大分': 'Oita', '大分県': 'Oita',
  '宮崎': 'Miyazaki', '宮崎県': 'Miyazaki',
  '鹿児島': 'Kagoshima', '鹿児島県': 'Kagoshima',
  '沖縄': 'Okinawa', '沖縄県': 'Okinawa',
  
  // English to Japanese (reverse mapping)
  'hokkaido': '北海道',
  'aomori': '青森',
  'iwate': '岩手',
  'miyagi': '宮城',
  'akita': '秋田',
  'yamagata': '山形',
  'fukushima': '福島',
  'ibaraki': '茨城',
  'tochigi': '栃木',
  'gunma': '群馬',
  'saitama': '埼玉',
  'chiba': '千葉',
  'tokyo': '東京',
  'kanagawa': '神奈川',
  'niigata': '新潟',
  'toyama': '富山',
  'ishikawa': '石川',
  'fukui': '福井',
  'yamanashi': '山梨',
  'nagano': '長野',
  'gifu': '岐阜',
  'shizuoka': '静岡',
  'aichi': '愛知',
  'mie': '三重',
  'shiga': '滋賀',
  'kyoto': '京都',
  'osaka': '大阪',
  'hyogo': '兵庫',
  'nara': '奈良',
  'wakayama': '和歌山',
  'tottori': '鳥取',
  'shimane': '島根',
  'okayama': '岡山',
  'hiroshima': '広島',
  'yamaguchi': '山口',
  'tokushima': '徳島',
  'kagawa': '香川',
  'ehime': '愛媛',
  'kochi': '高知',
  'fukuoka': '福岡',
  'saga': '佐賀',
  'nagasaki': '長崎',
  'kumamoto': '熊本',
  'oita': '大分',
  'miyazaki': '宮崎',
  'kagoshima': '鹿児島',
  'okinawa': '沖縄'
};

// Function to normalize prefecture search
function normalizePrefecture(prefecture) {
  if (!prefecture) return null;
  
  const searchTerm = prefecture.trim();
  
  // Direct match
  if (PREFECTURE_MAPPING[searchTerm]) {
    return [searchTerm, PREFECTURE_MAPPING[searchTerm]];
  }
  
  // Case insensitive match for English
  const lowerSearchTerm = searchTerm.toLowerCase();
  if (PREFECTURE_MAPPING[lowerSearchTerm]) {
    return [PREFECTURE_MAPPING[lowerSearchTerm], searchTerm];
  }
  
  // Return original term for partial matching
  return [searchTerm];
}

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

    // Apply filters with prefecture normalization
    if (prefecture) {
      const normalizedTerms = normalizePrefecture(prefecture);
      
      if (normalizedTerms && normalizedTerms.length > 0) {
        items = items.filter(item => {
          if (!item.prefecture) return false;
          
          // Check if item.prefecture matches any of the normalized terms
          return normalizedTerms.some(term => 
            item.prefecture.toLowerCase().includes(term.toLowerCase()) ||
            term.toLowerCase().includes(item.prefecture.toLowerCase())
          );
        });
      } else {
        // Fallback to partial matching
        items = items.filter(item => 
          item.prefecture && item.prefecture.toLowerCase().includes(prefecture.toLowerCase())
        );
      }
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
    const { lat, lng, radius = 5 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const centerLat = parseFloat(lat);
    const centerLng = parseFloat(lng);
    const radiusKm = parseFloat(radius);
    
    console.log(`Nearby search: Center(${centerLat}, ${centerLng}), Radius: ${radiusKm}km`);

    // Scan all items (in production, use geo indexing)
    const params = {
      TableName: 'ShrineTemple'
    };

    const result = await dynamodb.scan(params).promise();
    let items = result.Items || [];
    
    console.log(`Total items in database: ${items.length}`);

    // Filter by distance with detailed logging
    const nearbyItems = [];
    
    items.forEach(item => {
      if (!item.lat || !item.lng) {
        console.log(`Skipping ${item.name}: Missing coordinates`);
        return;
      }
      
      // Handle DynamoDB Decimal type conversion
      const itemLat = typeof item.lat === 'object' ? parseFloat(item.lat.toString()) : parseFloat(item.lat);
      const itemLng = typeof item.lng === 'object' ? parseFloat(item.lng.toString()) : parseFloat(item.lng);
      
      if (isNaN(itemLat) || isNaN(itemLng)) {
        console.log(`Skipping ${item.name}: Invalid coordinates (${item.lat}, ${item.lng})`);
        return;
      }
      
      const distance = calculateDistance(centerLat, centerLng, itemLat, itemLng);
      
      console.log(`${item.name}: (${itemLat}, ${itemLng}) - Distance: ${distance.toFixed(2)}km`);
      
      if (distance <= radiusKm) {
        nearbyItems.push({
          ...item,
          distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
        });
        console.log(`✓ ${item.name} is within ${radiusKm}km (${distance.toFixed(2)}km)`);
      } else {
        console.log(`✗ ${item.name} is outside ${radiusKm}km (${distance.toFixed(2)}km)`);
      }
    });
    
    console.log(`Found ${nearbyItems.length} items within ${radiusKm}km`);
    
    // Sort by distance
    nearbyItems.sort((a, b) => a.distance - b.distance);

    res.json(nearbyItems);
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

// Visit Records endpoints

// Get all visit records (for a user - simplified for demo)
app.get('/visit-records', async (req, res) => {
  try {
    const params = {
      TableName: 'VisitRecord'
    };

    const result = await dynamodb.scan(params).promise();
    let items = result.Items || [];

    // Sort by visit date (newest first)
    items.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));

    res.json(items);
  } catch (error) {
    console.error('Get visit records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new visit record
app.post('/visit-records', async (req, res) => {
  try {
    const {
      shrineTempleId,
      shrineTempleName,
      visitDate,
      notes,
      hasGoshuin,
      rating
    } = req.body;

    if (!shrineTempleId || !shrineTempleName || !visitDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const visitRecord = {
      id: `visit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: 'demo-user', // Simplified for demo
      shrineTempleId,
      shrineTempleName,
      visitDate,
      notes: notes || '',
      hasGoshuin: hasGoshuin || false,
      rating: rating || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const params = {
      TableName: 'VisitRecord',
      Item: visitRecord
    };

    await dynamodb.put(params).promise();
    res.status(201).json(visitRecord);
  } catch (error) {
    console.error('Create visit record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get visit record by ID
app.get('/visit-records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const params = {
      TableName: 'VisitRecord',
      Key: { id }
    };

    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
      return res.status(404).json({ error: 'Visit record not found' });
    }

    res.json(result.Item);
  } catch (error) {
    console.error('Get visit record by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update visit record
app.put('/visit-records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      shrineTempleName,
      visitDate,
      notes,
      hasGoshuin,
      rating
    } = req.body;

    const updateExpression = [];
    const expressionAttributeValues = {};

    if (shrineTempleName !== undefined) {
      updateExpression.push('shrineTempleName = :shrineTempleName');
      expressionAttributeValues[':shrineTempleName'] = shrineTempleName;
    }
    if (visitDate !== undefined) {
      updateExpression.push('visitDate = :visitDate');
      expressionAttributeValues[':visitDate'] = visitDate;
    }
    if (notes !== undefined) {
      updateExpression.push('notes = :notes');
      expressionAttributeValues[':notes'] = notes;
    }
    if (hasGoshuin !== undefined) {
      updateExpression.push('hasGoshuin = :hasGoshuin');
      expressionAttributeValues[':hasGoshuin'] = hasGoshuin;
    }
    if (rating !== undefined) {
      updateExpression.push('rating = :rating');
      expressionAttributeValues[':rating'] = rating;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const params = {
      TableName: 'VisitRecord',
      Key: { id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamodb.update(params).promise();
    res.json(result.Attributes);
  } catch (error) {
    console.error('Update visit record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete visit record
app.delete('/visit-records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const params = {
      TableName: 'VisitRecord',
      Key: { id }
    };

    await dynamodb.delete(params).promise();
    res.status(204).send();
  } catch (error) {
    console.error('Delete visit record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Goshuin API Server running on port ${PORT}`);
  console.log(`📍 LocalStack endpoint: ${process.env.LOCALSTACK_URL || 'http://localhost:4566'}`);
});