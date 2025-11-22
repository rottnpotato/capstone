import { NextResponse } from 'next/server';
import { ProductRepository } from '@/db/repositories';
import { db } from '@/db/connection';
import { Products, Categories, ProductUnits } from '@/db/schema';
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
    
    // Use db.query for easier relation fetching
    const productsData = await db.query.Products.findMany({
      with: {
        Category: true,
        ProductUnits: true,
      },
      where: (products, { eq, lte, and }) => {
        const conditions = [];
        if (lowStockOnly) conditions.push(lte(products.StockQuantity, "10")); // String for decimal comparison if needed, or number
        if (activeOnly) conditions.push(eq(products.IsActive, true));
        // Category filter needs to be handled carefully with relations or separate ID check
        // For simplicity, we can filter in memory or join if needed. 
        // But db.query doesn't support filtering by relation field easily without join.
        // Let's stick to the previous approach but add ProductUnits fetching.
        return conditions.length ? and(...conditions) : undefined;
      }
    });

    // Filter by category if needed (since we can't easily do it in db.query without knowing CategoryId)
    let filteredProducts = productsData;
    if (category && category !== 'all') {
      filteredProducts = productsData.filter(p => p.Category.Name === category);
    }

    // Format the products
    const products = filteredProducts.map((product) => ({
      id: product.ProductId,
      name: product.Name,
      price: parseFloat(String(product.Price)),
      basePrice: parseFloat(String(product.BasePrice)),
      category: product.Category.Name,
      image: product.Image || '',
      sku: product.Sku,
      stock: parseFloat(String(product.StockQuantity)), // Decimal
      unit: product.Unit,
      productUnits: product.ProductUnits.map(u => ({
        id: u.ProductUnitId,
        name: u.Name,
        conversionFactor: parseFloat(String(u.ConversionFactor)),
        price: u.Price ? parseFloat(String(u.Price)) : null,
        barcode: u.Barcode
      })),
      description: product.Description || '',
      supplier: product.Supplier || '',
      expiryDate: product.ExpiryDate || '',
      discountType: product.DiscountType || undefined,
      discountValue: parseFloat(String(product.DiscountValue || '0')),
      lastRestocked: product.UpdatedAt instanceof Date
        ? product.UpdatedAt.toISOString()
        : String(product.UpdatedAt || ''),
      isActive: product.IsActive
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
        Unit: body.unit || 'pcs',
        CategoryId: categoryId,
        Image: body.image || null, // Store the image data
        Supplier: body.supplier || null, // Store the supplier
        ExpiryDate: expiryDate,
        DiscountType: body.discountType || null,
        DiscountValue: body.discountValue || 0,
        IsActive: true
      })
      .returning();

    // Insert product units if any
    if (body.productUnits && Array.isArray(body.productUnits) && body.productUnits.length > 0) {
      await db.insert(ProductUnits).values(
        body.productUnits.map((u: any) => ({
          ProductId: newProduct[0].ProductId,
          Name: u.name,
          ConversionFactor: u.conversionFactor,
          Price: u.price || null,
          Barcode: u.barcode || null
        }))
      );
    }

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
        stock: parseFloat(newProduct[0].StockQuantity),
        unit: newProduct[0].Unit,
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