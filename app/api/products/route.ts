import { NextResponse } from 'next/server';
import { ProductRepository } from '@/db/repositories';
import { db } from '@/db/connection';
import { Products, Categories } from '@/db/schema';
import { eq, lte, and } from 'drizzle-orm';

/**
 * GET handler for retrieving all products
 */
export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const lowStockOnly = searchParams.get('lowStock') === 'true';
    const activeOnly = searchParams.get('activeOnly') === 'true';
    
    // Start with a base query
    let conditions = [];
    
    // Apply category filter
    if (category && category !== 'all') {
      conditions.push(eq(Categories.Name, category));
    }
    
    // Apply low stock filter if requested
    if (lowStockOnly) {
      conditions.push(lte(Products.StockQuantity, 10));
    }
    
    // Apply active filter if requested
    if (activeOnly) {
      conditions.push(eq(Products.IsActive, true));
    }
    
    // Execute the query with all conditions, selecting only required fields
    const rawProducts = await db.select({
      id: Products.ProductId,
      name: Products.Name,
      price: Products.Price,
      basePrice: Products.BasePrice,
      category: Categories.Name,
      image: Products.Image,
      sku: Products.Sku,
      stock: Products.StockQuantity,
      description: Products.Description,
      supplier: Products.Supplier,
      lastRestocked: Products.UpdatedAt,
      expiryDate: Products.ExpiryDate,
      discountType: Products.DiscountType,
      discountValue: Products.DiscountValue,
    })
      .from(Products)
      .leftJoin(Categories, eq(Products.CategoryId, Categories.CategoryId))
      .where(conditions.length ? and(...conditions) : undefined);
    
    // Format the products to match frontend expectations
    const products = rawProducts.map((product) => ({
      id: product.id,
      name: product.name,
      price: parseFloat(String(product.price)),
      basePrice: parseFloat(String(product.basePrice)),
      category: product.category || '',
      image: product.image || '',
      sku: product.sku,
      stock: product.stock,
      description: product.description || '',
      supplier: product.supplier || '',
      expiryDate: product.expiryDate || '',
      discountType: product.discountType || undefined,
      discountValue: parseFloat(String(product.discountValue || '0')),
      lastRestocked: product.lastRestocked instanceof Date
        ? product.lastRestocked.toISOString()
        : String(product.lastRestocked || ''),
    }));

    return NextResponse.json({ status: 'success', products });
  } catch (error: any) {
    console.error('Error retrieving products:', error);
    
    return NextResponse.json({
      status: 'error',
      message: `Error retrieving products: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}

/**
 * POST handler for creating a new product
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.price || !body.category || !body.sku) {
      return NextResponse.json({
        status: 'error',
        message: 'Missing required fields: name, price, category, and sku are required'
      }, { status: 400 });
    }

    // Find or create the category
    let categoryId;
    
    // Find existing category
    const existingCategory = await db
      .select()
      .from(Categories)
      .where(eq(Categories.Name, body.category))
      .limit(1);
    
    if (existingCategory.length > 0) {
      categoryId = existingCategory[0].CategoryId;
    } else {
      // Create new category
      const newCategory = await db
        .insert(Categories)
        .values({
          Name: body.category,
          Description: `Category for ${body.category} products`,
        })
        .returning();
      
      categoryId = newCategory[0].CategoryId;
    }

    // Parse expiry date
    let expiryDate = null;
    if (body.expiryDate) {
      expiryDate = new Date(body.expiryDate);
      if (isNaN(expiryDate.getTime())) {
        expiryDate = null;
      }
    }

    // Insert the product - only using fields that exist in the schema
    const newProduct = await db
      .insert(Products)
      .values({
        Name: body.name,
        Description: body.description || null,
        Sku: body.sku,
        Price: body.price,
        BasePrice: body.basePrice,
        StockQuantity: body.stock || 0,
        CategoryId: categoryId,
        Image: body.image || null, // Store the image data
        Supplier: body.supplier || null, // Store the supplier
        ExpiryDate: expiryDate,
        DiscountType: body.discountType || null,
        DiscountValue: body.discountValue || 0,
        IsActive: true
      })
      .returning();

    // Format the product for response
    return NextResponse.json({
      status: 'success',
      message: 'Product created successfully',
      product: {
        id: newProduct[0].ProductId,
        name: newProduct[0].Name,
        price: parseFloat(newProduct[0].Price),
        basePrice: parseFloat(newProduct[0].BasePrice),
        category: body.category,
        sku: newProduct[0].Sku,
        stock: newProduct[0].StockQuantity,
        description: newProduct[0].Description || '',
        supplier: newProduct[0].Supplier || '',
        image: newProduct[0].Image || '',
        expiryDate: newProduct[0].ExpiryDate ? new Date(newProduct[0].ExpiryDate).toISOString() : null,
        discountType: newProduct[0].DiscountType,
        discountValue: parseFloat(newProduct[0].DiscountValue || '0'),
        isActive: newProduct[0].IsActive
      }
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    
    if (error.message.includes('duplicate key value violates unique constraint')) {
      return NextResponse.json({
        status: 'error',
        message: 'A product with this SKU already exists'
      }, { status: 409 });
    }
    
    return NextResponse.json({
      status: 'error',
      message: `Error creating product: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
} 