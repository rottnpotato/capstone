import { NextResponse } from 'next/server';
import { db } from '@/db/connection';
import { Products, Categories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ProductRepository } from '@/db/repositories/ProductRepository';

/**
 * GET handler for retrieving a specific product by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);
    
    if (isNaN(productId)) {
      return NextResponse.json({
        status: 'error',
        message: 'Invalid product ID'
      }, { status: 400 });
    }
    
    // Get product and join with category
    const productData = await db
      .select()
      .from(Products)
      .leftJoin(Categories, eq(Products.CategoryId, Categories.CategoryId))
      .where(eq(Products.ProductId, productId))
      .limit(1);
    
    if (productData.length === 0) {
      return NextResponse.json({
        status: 'error',
        message: 'Product not found'
      }, { status: 404 });
    }
    
    const productItem = productData[0];
    
    // Format the response to match the frontend model
    const formattedProduct = {
      id: productItem.Products.ProductId,
      name: productItem.Products.Name,
      price: parseFloat(productItem.Products.Price),
      category: productItem.Categories ? productItem.Categories.Name : 'uncategorized',
      sku: productItem.Products.Sku,
      stock: productItem.Products.StockQuantity,
      description: productItem.Products.Description || '',
      supplier: productItem.Products.Supplier || 'Unknown supplier',
      image: productItem.Products.Image || '/placeholder.svg',
      expiryDate: productItem.Products.ExpiryDate ? new Date(productItem.Products.ExpiryDate).toISOString() : null,
      isActive: productItem.Products.IsActive,
      lastRestocked: productItem.Products.UpdatedAt 
        ? new Date(productItem.Products.UpdatedAt).toLocaleDateString('en-US', {
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
    
    return NextResponse.json({
      status: 'success',
      product: formattedProduct
    });
  } catch (error: any) {
    console.error('Error retrieving product:', error);
    
    return NextResponse.json({
      status: 'error',
      message: `Error retrieving product: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}

/**
 * PATCH handler for updating a specific product by ID
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);
    
    if (isNaN(productId)) {
      return NextResponse.json({
        status: 'error',
        message: 'Invalid product ID'
      }, { status: 400 });
    }
    
    const body = await request.json();
    
    // Parse expiry date if provided
    let expiryDate = undefined;
    if (body.expiryDate !== undefined) {
      if (body.expiryDate === null) {
        expiryDate = null;
      } else {
        expiryDate = new Date(body.expiryDate);
        if (isNaN(expiryDate.getTime())) {
          return NextResponse.json({
            status: 'error',
            message: 'Invalid expiry date format'
          }, { status: 400 });
        }
      }
    }
    
    // Update the product
    const updatedProduct = await db
      .update(Products)
      .set({
        StockQuantity: body.stock !== undefined ? body.stock : undefined,
        Price: body.price !== undefined ? body.price : undefined,
        Name: body.name || undefined,
        Description: body.description || undefined,
        Image: body.image || undefined,
        Supplier: body.supplier || undefined,
        ExpiryDate: expiryDate,
        IsActive: body.isActive !== undefined ? body.isActive : undefined,
        UpdatedAt: new Date()
      })
      .where(eq(Products.ProductId, productId))
      .returning();
    
    if (updatedProduct.length === 0) {
      return NextResponse.json({
        status: 'error',
        message: 'Product not found'
      }, { status: 404 });
    }
    
    // Get the category name
    const category = await db
      .select()
      .from(Categories)
      .where(eq(Categories.CategoryId, updatedProduct[0].CategoryId))
      .limit(1);
    
    // Format the response to match the frontend model
    const formattedProduct = {
      id: updatedProduct[0].ProductId,
      name: updatedProduct[0].Name,
      price: parseFloat(updatedProduct[0].Price),
      category: category.length > 0 ? category[0].Name : 'uncategorized',
      sku: updatedProduct[0].Sku,
      stock: updatedProduct[0].StockQuantity,
      description: updatedProduct[0].Description || '',
      supplier: updatedProduct[0].Supplier || 'Unknown supplier',
      image: updatedProduct[0].Image || '/placeholder.svg',
      expiryDate: updatedProduct[0].ExpiryDate ? new Date(updatedProduct[0].ExpiryDate).toISOString() : null,
      isActive: updatedProduct[0].IsActive,
      lastRestocked: updatedProduct[0].UpdatedAt 
        ? new Date(updatedProduct[0].UpdatedAt).toLocaleDateString('en-US', {
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
    
    return NextResponse.json({
      status: 'success',
      message: 'Product updated successfully',
      product: formattedProduct
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    
    return NextResponse.json({
      status: 'error',
      message: `Error updating product: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}

/**
 * DELETE handler for archiving a product (not actually deleting)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);
    
    if (isNaN(productId)) {
      return NextResponse.json({
        status: 'error',
        message: 'Invalid product ID'
      }, { status: 400 });
    }
    
    // Archive the product instead of deleting it
    const archivedProduct = await ProductRepository.Archive(productId);
    
    if (!archivedProduct) {
      return NextResponse.json({
        status: 'error',
        message: 'Product not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Product archived successfully',
      product: {
        id: archivedProduct.ProductId,
        isActive: archivedProduct.IsActive
      }
    });
  } catch (error: any) {
    console.error('Error archiving product:', error);
    
    return NextResponse.json({
      status: 'error',
      message: `Error archiving product: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}

/**
 * PUT handler for completely replacing a product with new data
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);
    
    if (isNaN(productId)) {
      return NextResponse.json({
        status: 'error',
        message: 'Invalid product ID'
      }, { status: 400 });
    }
    
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
    
    // Parse expiry date if provided
    let expiryDate = null;
    if (body.expiryDate) {
      expiryDate = new Date(body.expiryDate);
      if (isNaN(expiryDate.getTime())) {
        return NextResponse.json({
          status: 'error',
          message: 'Invalid expiry date format'
        }, { status: 400 });
      }
    }
    
    // Update the product with all new values
    const updatedProduct = await db
      .update(Products)
      .set({
        Name: body.name,
        Description: body.description || null,
        Sku: body.sku,
        Price: body.price,
        StockQuantity: body.stock || 0,
        CategoryId: categoryId,
        Image: body.image || null,
        Supplier: body.supplier || null,
        ExpiryDate: expiryDate,
        IsActive: body.isActive !== undefined ? body.isActive : true,
        UpdatedAt: new Date()
      })
      .where(eq(Products.ProductId, productId))
      .returning();
    
    if (updatedProduct.length === 0) {
      return NextResponse.json({
        status: 'error',
        message: 'Product not found'
      }, { status: 404 });
    }
    
    // Format the response to match the frontend model
    const formattedProduct = {
      id: updatedProduct[0].ProductId,
      name: updatedProduct[0].Name,
      price: parseFloat(updatedProduct[0].Price),
      category: body.category,
      sku: updatedProduct[0].Sku,
      stock: updatedProduct[0].StockQuantity,
      description: updatedProduct[0].Description || '',
      supplier: updatedProduct[0].Supplier || 'Unknown supplier',
      image: updatedProduct[0].Image || '/placeholder.svg',
      expiryDate: updatedProduct[0].ExpiryDate ? new Date(updatedProduct[0].ExpiryDate).toISOString() : null,
      isActive: updatedProduct[0].IsActive,
      lastRestocked: updatedProduct[0].UpdatedAt 
        ? new Date(updatedProduct[0].UpdatedAt).toLocaleDateString('en-US', {
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
    
    return NextResponse.json({
      status: 'success',
      message: 'Product updated successfully',
      product: formattedProduct
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    
    // Handle duplicate SKU
    if (error.message.includes('duplicate key value violates unique constraint')) {
      return NextResponse.json({
        status: 'error',
        message: 'A product with this SKU already exists'
      }, { status: 409 });
    }
    
    return NextResponse.json({
      status: 'error',
      message: `Error updating product: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
} 