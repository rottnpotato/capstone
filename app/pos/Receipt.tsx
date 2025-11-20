"use client"

import React from 'react';
import { CompletedTransaction } from './PointOfSaleClient';

interface ReceiptProps {
  data: CompletedTransaction | null;
}

export const Receipt: React.FC<ReceiptProps> = ({ data }) => {
  if (!data) {
    return null;
  }

  const {
    transactionId,
    items,
    subtotal,
    discount,
    manualDiscount,
    total,
    cashierName,
    member,
  } = data;

  return (
    <div id="receipt-print" className="p-4 bg-white text-black font-mono text-xs w-[300px]">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold">Pandol</h2>
        <p>Official Receipt</p>
        <p>Date: {new Date().toLocaleString()}</p>
      </div>

      <div className="mb-2">
        <p>Transaction ID: {transactionId}</p>
        <p>Cashier: {cashierName}</p>
        {member && <p className="capitalize">Member: {member.Name}</p>}
      </div>

      <hr className="border-dashed border-black my-2" />

      <div>
        {items.map((item) => (
          <div key={item.Id} className="flex justify-between my-1">
            <div>
              <p className="font-medium leading-tight capitalize">{item.Name}</p>
              <p className="pl-2">{item.quantity} x ₱{item.Price.toFixed(2)}</p>
            </div>
            <p>₱{(item.quantity * item.Price).toFixed(2)}</p>
          </div>
        ))}
      </div>

      <hr className="border-dashed border-black my-2" />

      <div className="space-y-1">
        <div className="flex justify-between">
          <p>Subtotal:</p>
          <p>₱{(subtotal + discount).toFixed(2)}</p>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <p>Product Discounts:</p>
            <p>- ₱{discount.toFixed(2)}</p>
          </div>
        )}
        {manualDiscount > 0 && (
          <div className="flex justify-between">
            <p>Manual Discount:</p>
            <p>- ₱{manualDiscount.toFixed(2)}</p>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm mt-2">
          <p>TOTAL:</p>
          <p>₱{total.toFixed(2)}</p>
        </div>
      </div>

      <hr className="border-dashed border-black my-2" />

      <div className="text-center mt-4">
        <p>Thank you for your purchase!</p>
      </div>
    </div>
  );
};
