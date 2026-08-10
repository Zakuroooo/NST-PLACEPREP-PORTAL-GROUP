/**
 * GET /api/practice/categories
 * Returns real question counts grouped by questionType for the Practice Zone category cards.
 * Only counts verified, non-duplicate records so counts match what students can actually access.
 */

import { NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import Question from 'placeprep-backend/src/models/Question';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(): Promise<NextResponse> {
  try {
    await connectDB();

    const rows = await Question.aggregate([
      { $match: { isDuplicate: { $ne: true }, verified: true } },
      { $group: { _id: '$questionType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const categories = rows
      .filter((r: { _id: unknown; count: number }) => r._id)
      .map((r: { _id: unknown; count: number }) => ({ questionType: r._id as string, count: r.count as number }));

    return successResponse(categories);
  } catch (error) {
    return handleApiError(error);
  }
}
