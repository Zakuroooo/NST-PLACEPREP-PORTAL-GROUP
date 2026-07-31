import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import Question from 'placeprep-backend/src/models/Question';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await requireStudent(request);

    const stats = await Question.aggregate([
      {
        $group: {
          _id: "$roundType",
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      coding: 0,
      systemDesign: 0,
      aptitude: 0,
      total: 0
    };

    for (const stat of stats) {
      if (stat._id === 'Coding') result.coding = stat.count;
      else if (stat._id === 'System Design') result.systemDesign = stat.count;
      else if (stat._id === 'Aptitude') result.aptitude = stat.count;
      result.total += stat.count;
    }

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
