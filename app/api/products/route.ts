import { NextResponse } from 'next/server';
import { ProductRepository } from '@/db/repositories';
import { db } from '@/db/connection';
import { Products, Categories } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET handler for retrieving all products
 */
export async function GET(request: Request) {
  try {
    // Check if we should return only low stock products
    const { searchParams } = new URL(request.url);
    const lowStock = searchParams.get('low_stock');
    const threshold = searchParams.get('threshold');
    
    let productsData;
    
    if (lowStock === 'true') {
      productsData = await ProductRepository.GetLowStock(
        threshold ? parseInt(threshold) : 10
      );
    } else {
      productsData = await ProductRepository.GetAll();
    }
    
    // Format the response to match the frontend model
    const formattedProducts = productsData.map(item => {
      const product = item.Products || item;
      const category = item.Categories ? item.Categories.Name : null;
      
      return {
        id: product.ProductId,
        name: product.Name,
        price: parseFloat(product.Price),
        category: category || 'uncategorized',
        sku: product.Sku,
        stock: product.StockQuantity,
        description: product.Description || '',
        supplier: product.Supplier || 'Unknown supplier',
        image: product.Image || '/placeholder.svg',
        lastRestocked: product.UpdatedAt 
          ? new Date(product.UpdatedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })
          : new Date().toLocaleDateString('en-US', {
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })
      };
    });
    
    return NextResponse.json({
      status: 'success',
      products: formattedProducts
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    
    return NextResponse.json({
      status: 'error',
      message: `Error fetching products: ${error.message || 'Unknown error'}`
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

    // Insert the product - only using fields that exist in the schema
    const newProduct = await db
      .insert(Products)
      .values({
        Name: body.name,
        Description: body.description || null,
        Sku: body.sku,
        Price: body.price,
        StockQuantity: body.stock || 0,
        CategoryId: categoryId,
        Image: body.image || null, // Store the image data
        Supplier: body.supplier || null, // Store the supplier
      })
      .returning();

    // Format the response to match the frontend model
    const formattedProduct = {
      id: newProduct[0].ProductId,
      name: newProduct[0].Name,
      price: parseFloat(newProduct[0].Price),
      category: body.category,
      sku: newProduct[0].Sku,
      stock: newProduct[0].StockQuantity,
      description: newProduct[0].Description || '',
      supplier: newProduct[0].Supplier || 'Unknown supplier',
      image: newProduct[0].Image || '/placeholder.svg',
      lastRestocked: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    };

    return NextResponse.json({
      status: 'success',
      message: 'Product created successfully',
      product: formattedProduct
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    
    // Handle duplicate SKU
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