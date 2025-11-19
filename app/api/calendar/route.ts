import { NextResponse } from 'next/server';
import { z } from 'zod';

// Event type definition
export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  location?: string;
  type: 'meeting' | 'promotion' | 'inventory' | 'member' | 'holiday';
  createdBy?: string;
}

// Validation schema
const timeRangeSchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  month: z.number().optional(),
  year: z.number().optional(),
});

// Mock data - in production this would come from a database
const events: CalendarEvent[] = [
  {
    id: '1',
    title: 'Board Meeting',
    description: 'Monthly board meeting to discuss cooperative finances',
    startDate: '2023-10-15T09:00:00',
    endDate: '2023-10-15T11:00:00',
    allDay: false,
    location: 'Conference Room A',
    type: 'meeting'
  },
  {
    id: '2',
    title: 'Inventory Restocking',
    description: 'Major inventory restocking for all departments',
    startDate: '2023-10-20T08:00:00',
    endDate: '2023-10-20T17:00:00',
    allDay: true,
    type: 'inventory'
  },
  {
    id: '3',
    title: 'New Member Orientation',
    description: 'Introduction session for new cooperative members',
    startDate: '2023-10-25T14:00:00',
    endDate: '2023-10-25T16:00:00',
    allDay: false,
    location: 'Training Room',
    type: 'member'
  },
  {
    id: '4',
    title: 'Holiday Sale',
    description: 'Special holiday discounts on selected items',
    startDate: '2023-11-01T00:00:00',
    endDate: '2023-11-10T23:59:59',
    allDay: true,
    type: 'promotion'
  },
  {
    id: '5',
    title: 'Financial Quarter Review',
    description: 'Review of financial performance for Q3',
    startDate: '2023-10-30T10:00:00',
    endDate: '2023-10-30T12:00:00',
    allDay: false,
    location: 'Conference Room B',
    type: 'meeting'
  },
  {
    id: '6',
    title: 'Staff Training',
    description: 'POS system training for new staff members',
    startDate: '2023-11-05T09:00:00',
    endDate: '2023-11-05T15:00:00',
    allDay: false,
    location: 'Training Center',
    type: 'meeting'
  },
  {
    id: '7',
    title: 'Independence Day',
    description: 'Cooperative closed for Independence Day',
    startDate: '2023-11-12T00:00:00',
    endDate: '2023-11-12T23:59:59',
    allDay: true,
    type: 'holiday'
  },
  {
    id: '8',
    title: 'Inventory Audit',
    description: 'Annual inventory audit',
    startDate: '2023-11-15T08:00:00',
    endDate: '2023-11-17T17:00:00',
    allDay: true,
    type: 'inventory'
  },
  {
    id: '9',
    title: 'Member Appreciation Day',
    description: 'Special events and discounts for cooperative members',
    startDate: '2023-11-20T08:00:00',
    endDate: '2023-11-20T20:00:00',
    allDay: true,
    type: 'member'
  },
  {
    id: '10',
    title: 'End of Month Reporting',
    description: 'Preparation of monthly financial reports',
    startDate: '2023-11-30T14:00:00',
    endDate: '2023-11-30T17:00:00',
    allDay: false,
    location: 'Finance Department',
    type: 'meeting'
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate parameters
    const validParams = timeRangeSchema.safeParse({
      start: searchParams.get('start') || undefined,
      end: searchParams.get('end') || undefined,
      month: searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined,
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
    });

    if (!validParams.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validParams.error },
        { status: 400 }
      );
    }

    const params = validParams.data;
    
    // Filter events based on parameters
    let filteredEvents = [...events];
    
    if (params.start && params.end) {
      const startDate = new Date(params.start);
      const endDate = new Date(params.end);
      
      filteredEvents = filteredEvents.filter(event => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        
        return (eventStart >= startDate && eventStart <= endDate) || 
               (eventEnd >= startDate && eventEnd <= endDate) ||
               (eventStart <= startDate && eventEnd >= endDate);
      });
    } else if (params.month !== undefined && params.year !== undefined) {
      // Month is 0-indexed in JavaScript Date
      const startOfMonth = new Date(params.year, params.month, 1);
      const endOfMonth = new Date(params.year, params.month + 1, 0, 23, 59, 59, 999);
      
      filteredEvents = filteredEvents.filter(event => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        
        return (eventStart >= startOfMonth && eventStart <= endOfMonth) || 
               (eventEnd >= startOfMonth && eventEnd <= endOfMonth) ||
               (eventStart <= startOfMonth && eventEnd >= endOfMonth);
      });
    }

    return NextResponse.json(filteredEvents);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // In a real app, this would validate and save the event to a database
    // For now, we'll just return a success message
    return NextResponse.json(
      { message: 'Event created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    );
  }
} 