import { db } from '../connection';
import { Events } from '../schema';
import { eq, desc, lt, gte } from 'drizzle-orm';

/**
 * Repository for Event data access
 */
export class EventRepository {
  /**
   * Get all events
   */
  static async GetAll() {
    try {
      return await db.select()
        .from(Events)
        .orderBy(desc(Events.EventDate));
    } catch (error) {
      console.error('Error getting all events:', error);
      throw error;
    }
  }

  /**
   * Get upcoming events (from today onward)
   */
  static async GetUpcoming(limit: number = 10) {
    try {
      const today = new Date();
      return await db.select()
        .from(Events)
        .where(gte(Events.EventDate, today))
        .orderBy(Events.EventDate)
        .limit(limit);
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      throw error;
    }
  }

  /**
   * Get past events (before today)
   */
  static async GetPastEvents(limit: number = 10) {
    try {
      const today = new Date();
      return await db.select()
        .from(Events)
        .where(lt(Events.EventDate, today))
        .orderBy(desc(Events.EventDate))
        .limit(limit);
    } catch (error) {
      console.error('Error getting past events:', error);
      throw error;
    }
  }

  /**
   * Get an event by ID
   */
  static async GetById(eventId: number) {
    try {
      const results = await db.select()
        .from(Events)
        .where(eq(Events.EventId, eventId));
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error getting event by ID ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new event
   */
  static async Create(eventData: {
    Title: string;
    Description?: string;
    EventDate: Date;
    Type: 'Operation' | 'Community' | 'Management';
  }) {
    try {
      const results = await db.insert(Events)
        .values(eventData)
        .returning();
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  /**
   * Update an event
   */
  static async Update(eventId: number, eventData: Partial<{
    Title: string;
    Description: string;
    EventDate: Date;
    Type: 'Operation' | 'Community' | 'Management';
  }>) {
    try {
      const results = await db.update(Events)
        .set({
          ...eventData,
          UpdatedAt: new Date()
        })
        .where(eq(Events.EventId, eventId))
        .returning();
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error updating event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Delete an event
   */
  static async Delete(eventId: number) {
    try {
      const results = await db.delete(Events)
        .where(eq(Events.EventId, eventId))
        .returning();
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error deleting event ${eventId}:`, error);
      throw error;
    }
  }
} 