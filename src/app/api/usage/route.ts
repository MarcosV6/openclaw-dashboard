import { NextResponse } from 'next/server';
import { getTotalStats, getUsageOverTime, getCostByModel, getTokenDistribution, checkDatabaseExists } from '../../../lib/db';

export async function GET() {
  try {
    const dbExists = await checkDatabaseExists();
    
    if (!dbExists) {
      return NextResponse.json({
        error: 'Database not found',
        message: 'usage.db does not exist yet. Phase 1 data collection needs to be running.',
        hasData: false,
      });
    }

    const [stats, usageOverTime, costByModel, tokenDistribution] = await Promise.all([
      getTotalStats(),
      getUsageOverTime(7),
      getCostByModel(),
      getTokenDistribution(),
    ]);

    return NextResponse.json({
      hasData: true,
      stats,
      usageOverTime,
      costByModel,
      tokenDistribution,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}