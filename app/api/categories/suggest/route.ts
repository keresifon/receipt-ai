import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { apiRateLimit } from '@/lib/rate-limit'

// Category patterns for auto-suggestions
const CATEGORY_PATTERNS = {
  'Groceries': [
    'milk', 'bread', 'cheese', 'eggs', 'meat', 'chicken', 'beef', 'pork', 'fish',
    'vegetables', 'fruits', 'apple', 'banana', 'orange', 'tomato', 'lettuce',
    'cereal', 'pasta', 'rice', 'beans', 'soup', 'canned', 'frozen', 'dairy',
    'yogurt', 'butter', 'cream', 'juice', 'water', 'soda', 'snacks', 'chips',
    'cookies', 'candy', 'chocolate', 'ice cream', 'frozen food', 'organic'
  ],
  'Restaurants & Dining': [
    'restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'sandwich', 'salad',
    'soup', 'pasta', 'steak', 'seafood', 'chinese', 'italian', 'mexican',
    'indian', 'japanese', 'thai', 'fast food', 'takeout', 'delivery',
    'dining', 'lunch', 'dinner', 'breakfast', 'brunch', 'appetizer',
    'dessert', 'beverage', 'alcohol', 'wine', 'beer', 'cocktail'
  ],
  'Transportation': [
    'gas', 'fuel', 'gasoline', 'petrol', 'uber', 'lyft', 'taxi', 'cab',
    'parking', 'toll', 'bus', 'train', 'subway', 'metro', 'transit',
    'car', 'vehicle', 'maintenance', 'repair', 'oil change', 'tire',
    'insurance', 'registration', 'license', 'parking ticket', 'traffic'
  ],
  'Shopping': [
    'clothing', 'shoes', 'shirt', 'pants', 'dress', 'jacket', 'coat',
    'electronics', 'phone', 'computer', 'laptop', 'tablet', 'camera',
    'books', 'magazine', 'newspaper', 'stationery', 'office supplies',
    'home', 'furniture', 'decor', 'kitchen', 'bathroom', 'bedroom',
    'jewelry', 'accessories', 'bag', 'purse', 'wallet', 'watch'
  ],
  'Healthcare': [
    'pharmacy', 'medicine', 'prescription', 'drug', 'pill', 'tablet',
    'doctor', 'physician', 'clinic', 'hospital', 'medical', 'dental',
    'vision', 'glasses', 'contact', 'lens', 'insurance', 'copay',
    'vitamin', 'supplement', 'first aid', 'bandage', 'ointment'
  ],
  'Entertainment': [
    'movie', 'theater', 'cinema', 'concert', 'show', 'performance',
    'ticket', 'admission', 'museum', 'zoo', 'aquarium', 'park',
    'game', 'video game', 'board game', 'puzzle', 'toy', 'hobby',
    'sport', 'fitness', 'gym', 'yoga', 'pilates', 'swimming'
  ],
  'Utilities': [
    'electricity', 'electric', 'power', 'gas', 'natural gas', 'water',
    'sewer', 'garbage', 'trash', 'waste', 'internet', 'wifi', 'cable',
    'phone', 'telephone', 'mobile', 'cell', 'heating', 'cooling',
    'air conditioning', 'ac', 'heater', 'furnace', 'thermostat'
  ],
  'Home & Garden': [
    'hardware', 'tool', 'paint', 'lumber', 'wood', 'nails', 'screws',
    'garden', 'plant', 'flower', 'seed', 'fertilizer', 'soil',
    'lawn', 'grass', 'mower', 'rake', 'shovel', 'hose', 'sprinkler',
    'furniture', 'appliance', 'refrigerator', 'stove', 'oven', 'dishwasher'
  ],
  'Personal Care': [
    'cosmetic', 'makeup', 'skincare', 'shampoo', 'soap', 'toothpaste',
    'deodorant', 'perfume', 'cologne', 'lotion', 'cream', 'oil',
    'hair', 'nail', 'spa', 'salon', 'barber', 'beauty', 'grooming',
    'hygiene', 'personal', 'care', 'wellness', 'fitness'
  ],
  'Education': [
    'school', 'college', 'university', 'course', 'class', 'lesson',
    'book', 'textbook', 'supply', 'tuition', 'fee', 'registration',
    'library', 'study', 'learning', 'training', 'workshop', 'seminar',
    'certification', 'degree', 'diploma', 'scholarship', 'loan'
  ],
  'Financial': [
    'bank', 'credit', 'debit', 'loan', 'mortgage', 'insurance',
    'investment', 'stock', 'bond', 'fund', 'retirement', 'savings',
    'checking', 'account', 'fee', 'charge', 'interest', 'payment',
    'transfer', 'withdrawal', 'deposit', 'atm', 'cash'
  ]
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    await apiRateLimit(req)
    
    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { description } = await req.json()
    
    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    // Connect to database
    const client = await clientPromise
    const db = client.db()
    
    // Get user's account
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(session.user.id) },
      { projection: { accountId: 1 } }
    )
    
    if (!user?.accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Get existing categories from user's data for context
    const existingCategories = await db.collection('line_items')
      .aggregate([
        { $match: { accountId: new ObjectId(user.accountId) } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]).toArray()

    const existingCategoryNames = existingCategories.map(cat => cat._id.toLowerCase())

    // Find matching categories based on description
    const descriptionLower = description.toLowerCase()
    const matches: Array<{ category: string, score: number, reason: string }> = []

    // Check pattern matches
    for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
      for (const pattern of patterns) {
        if (descriptionLower.includes(pattern)) {
          const score = pattern.length / descriptionLower.length // Longer patterns get higher scores
          matches.push({
            category,
            score,
            reason: `Contains "${pattern}"`
          })
          break // Only count first match per category
        }
      }
    }

    // Check exact matches with existing categories
    for (const existingCat of existingCategoryNames) {
      if (descriptionLower.includes(existingCat)) {
        matches.push({
          category: existingCat.charAt(0).toUpperCase() + existingCat.slice(1),
          score: 0.9, // High score for exact matches
          reason: 'Matches existing category'
        })
      }
    }

    // Sort by score and remove duplicates
    const uniqueMatches = matches
      .filter((match, index, self) => 
        index === self.findIndex(m => m.category === match.category)
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 5) // Top 5 suggestions

    // If no matches found, suggest based on common patterns
    if (uniqueMatches.length === 0) {
      // Check for common words that might indicate category
      const commonWords = descriptionLower.split(/\s+/).filter(word => word.length > 3)
      
      for (const word of commonWords) {
        for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
          if (patterns.some(pattern => 
            word.includes(pattern) || pattern.includes(word)
          )) {
            uniqueMatches.push({
              category,
              score: 0.3,
              reason: `Similar to "${word}"`
            })
            break
          }
        }
      }
    }

    // Add "Other" as fallback
    if (uniqueMatches.length === 0) {
      uniqueMatches.push({
        category: 'Other',
        score: 0.1,
        reason: 'No specific pattern match'
      })
    }

    return NextResponse.json({
      suggestions: uniqueMatches,
      confidence: uniqueMatches.length > 0 ? uniqueMatches[0].score : 0
    })

  } catch (error) {
    console.error('Category suggestion error:', error)
    return NextResponse.json(
      { error: 'Failed to get category suggestions' },
      { status: 500 }
    )
  }
}
