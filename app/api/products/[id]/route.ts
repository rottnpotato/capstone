import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connection';
import { Products, Categories, ProductUnits } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ProductRepository } from '@/db/repositories/ProductRepository';
import { SendLowStockNotification, SendExpiryWarningNotification } from '@/lib/notifications';
import { io } from '@/lib/socket';
interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET handler for retrieving a specific product by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const productId = parseInt(params.id);
    
    if (isNaN(productId)) {
      return NextResponse.json({
        status: 'error',
        message: 'Invalid product ID'
      }, { status: 400 });
    }
    
    const product = await db.query.Products.findFirst({
      where: eq(Products.ProductId, productId)
    });
    
    if (!product) {
      return NextResponse.json({
        status: 'error',
        message: 'Product not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      status: 'success',
      product: {
        id: product.ProductId,
        name: product.Name,
        description: product.Description,
        sku: product.Sku,
        price: parseFloat(String(product.Price)),
        basePrice: parseFloat(String(product.BasePrice)),
        stock: product.StockQuantity,
        categoryId: product.CategoryId,
        image: product.Image,
        supplier: product.Supplier,
        expiryDate: product.ExpiryDate,
        discountType: product.DiscountType,
        discountValue: parseFloat(String(product.DiscountValue || '0')),
        isActive: product.IsActive
      }
    });
  } catch (error: any) {
    console.error(`Error retrieving product:`, error);
    
    return NextResponse.json({
      status: 'error',
      message: `Error retrieving product: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}

/**
 * PATCH handler for updating a specific product by ID
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const productId = parseInt(params.id);
    const body = await request.json();
    
    if (isNaN(productId)) {
      return NextResponse.json({
        status: 'error',
        message: 'Invalid product ID'
      }, { status: 400 });
    }
    
    // Get the current product
    const currentProduct = await db.query.Products.findFirst({
      where: eq(Products.ProductId, productId)
    });
    
    if (!currentProduct) {
      return NextResponse.json({
        status: 'error',
        message: 'Product not found'
      }, { status: 404 });
    }
    
    // Prevent negative stock
    if (body.stock !== undefined && body.stock < 0) {
      return NextResponse.json({
        status: 'error',
        message: 'Stock quantity cannot be negative'
      }, { status: 400 });
    }
    
    // Prepare update object
    const updateData: Partial<typeof Products.$inferInsert> = {};
    
    // Only include fields that are provided in the request
    if (body.name !== undefined) updateData.Name = body.name;
    if (body.description !== undefined) updateData.Description = body.description;
    if (body.price !== undefined) updateData.Price = body.price;
    if (body.basePrice !== undefined) updateData.BasePrice = body.basePrice;
    if (body.stock !== undefined) updateData.StockQuantity = body.stock;
    if (body.categoryId !== undefined) updateData.CategoryId = body.categoryId;
    if (body.image !== undefined) updateData.Image = body.image;
    if (body.supplier !== undefined) updateData.Supplier = body.supplier;
    if (body.isActive !== undefined) updateData.IsActive = body.isActive;
    if (body.discountType !== undefined) updateData.DiscountType = body.discountType;
    if (body.discountValue !== undefined) updateData.DiscountValue = body.discountValue;
    
    // Handle expiry date
    if (body.expiryDate !== undefined) {
      updateData.ExpiryDate = body.expiryDate ? new Date(body.expiryDate) : null;
    }
    
    // Update the product
    const updatedProduct = await db
      .update(Products)
      .set({
        ...updateData,
        UpdatedAt: new Date()
      })
      .where(eq(Products.ProductId, productId))
      .returning();
    
    if (!updatedProduct.length) {
      throw new Error('Failed to update product');
    }
    
    const product = updatedProduct[0];
    
    // Check if stock is low (less than or equal to 10) and send notification
    if (
      body.stock !== undefined && 
      body.stock <= 10 && 
      (currentProduct.StockQuantity === null || currentProduct.StockQuantity > 10)
    ) {
      try {
        await SendLowStockNotification(
          product.ProductId,
          product.Name,
          product.StockQuantity
        );
      } catch (notifError) {
        console.error('Error sending low stock notification:', notifError);
      }
    }
    
    // Check if expiry date is within 30 days
    if (
      product.ExpiryDate && 
      body.expiryDate !== undefined
    ) {
      const expiryDate = new Date(product.ExpiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        try {
          await SendExpiryWarningNotification(
            product.ProductId,
            product.Name,
            expiryDate
          );
        } catch (notifError) {
          console.error('Error sending expiry warning notification:', notifError);
        }
      }
    }
    
    // If the socket server is initialized, broadcast the update
    if (io) {
      const categoryResult = await db.query.Categories.findFirst({
        where: eq(Categories.CategoryId, product.CategoryId)
      });

      const formattedProductForClient = {
        id: product.ProductId.toString(),
        name: product.Name,
        price: parseFloat(String(product.Price)),
        basePrice: parseFloat(String(product.BasePrice)),
        profitValue: parseFloat(String(product.Price)) - parseFloat(String(product.BasePrice)),
        category: categoryResult?.Name || 'uncategorized',
        image: product.Image || '/placeholder.svg',
        stock: product.StockQuantity,
        description: product.Description || '',
        supplier: product.Supplier || 'No supplier',
        lastRestocked: new Date(product.UpdatedAt).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric'
        }),
        sku: product.Sku,
        expiryDate: product.ExpiryDate ? new Date(product.ExpiryDate).toISOString() : null,
        discountType: product.DiscountType,
        discountValue: parseFloat(String(product.DiscountValue || '0')),
        isActive: product.IsActive,
      };
      io.emit('product_updated', formattedProductForClient);
      console.log(`[Socket.IO] Emitted 'product_updated' for product ID: ${product.ProductId}`);
    }

    return NextResponse.json({
      status: 'success',
      message: 'Product updated successfully',
      product: {
        id: product.ProductId,
        name: product.Name,
        description: product.Description,
        sku: product.Sku,
        price: parseFloat(String(product.Price)),
        basePrice: parseFloat(String(product.BasePrice)),
        stock: product.StockQuantity,
        categoryId: product.CategoryId,
        image: product.Image,
        supplier: product.Supplier,
        expiryDate: product.ExpiryDate,
        discountType: product.DiscountType,
        discountValue: parseFloat(String(product.DiscountValue || '0')),
        isActive: product.IsActive
      }
    });
  } catch (error: any) {
    console.error(`Error updating product:`, error);
    
    return NextResponse.json({
      status: 'error',
      message: `Error updating product: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}

/**
 * DELETE handler for archiving a product (not actually deleting)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const productId = parseInt(params.id);
    
    if (isNaN(productId)) {
      return NextResponse.json({
        status: 'error',
        message: 'Invalid product ID'
      }, { status: 400 });
    }
    
    // Soft delete by setting isActive to false
    const deactivatedProduct = await db
      .update(Products)
      .set({
        IsActive: false,
        UpdatedAt: new Date()
      })
      .where(eq(Products.ProductId, productId))
      .returning();
    
    if (!deactivatedProduct.length) {
      return NextResponse.json({
        status: 'error',
        message: 'Product not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Product deactivated successfully'
    });
  } catch (error: any) {
    console.error(`Error deactivating product:`, error);
    
    return NextResponse.json({
      status: 'error',
      message: `Error deactivating product: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}

/**
 * PUT handler for completely replacing a product with new data
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    
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
        BasePrice: body.basePrice,
        StockQuantity: body.stock || 0,
        Unit: body.unit || 'pcs',
        CategoryId: categoryId,
        Image: body.image || null,
        Supplier: body.supplier || null,
        ExpiryDate: expiryDate,
        DiscountType: body.discountType || null,
        DiscountValue: body.discountValue || 0,
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

    // Handle ProductUnits update
    if (body.productUnits) {
       // Delete existing units for this product
       await db.delete(ProductUnits).where(eq(ProductUnits.ProductId, productId));
       
       // Insert new units if any
       if (Array.isArray(body.productUnits) && body.productUnits.length > 0) {
         await db.insert(ProductUnits).values(body.productUnits.map((u: any) => ({
           ProductId: productId,
           Name: u.name,
           ConversionFactor: u.conversionFactor,
           Price: u.price || null,
           Barcode: u.barcode || null
         })));
       }
    }
    
    // Format the response to match the frontend model
    const formattedProduct = {
      id: updatedProduct[0].ProductId,
      name: updatedProduct[0].Name,
      price: parseFloat(updatedProduct[0].Price),
      basePrice: parseFloat(updatedProduct[0].BasePrice),
      category: body.category,
      sku: updatedProduct[0].Sku,
      stock: updatedProduct[0].StockQuantity,
      description: updatedProduct[0].Description || '',
      supplier: updatedProduct[0].Supplier || 'Unknown supplier',
      image: updatedProduct[0].Image || '/placeholder.svg',
      expiryDate: updatedProduct[0].ExpiryDate ? new Date(updatedProduct[0].ExpiryDate).toISOString() : null,
      discountType: updatedProduct[0].DiscountType,
      discountValue: parseFloat(updatedProduct[0].DiscountValue || '0'),
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