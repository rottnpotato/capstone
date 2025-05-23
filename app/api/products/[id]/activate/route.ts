import { NextResponse } from 'next/server';
import { ProductRepository } from '@/db/repositories/ProductRepository';

/**
 * POST handler for activating an archived product
 */
export async function POST(
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
    
    // Activate the product
    const activatedProduct = await ProductRepository.Activate(productId);
    
    if (!activatedProduct) {
      return NextResponse.json({
        status: 'error',
        message: 'Product not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Product activated successfully',
      product: {
        id: activatedProduct.ProductId,
        isActive: activatedProduct.IsActive
      }
    });
  } catch (error: any) {
    console.error('Error activating product:', error);
    
    return NextResponse.json({
      status: 'error',
      message: `Error activating product: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
} 